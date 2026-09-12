import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupUnverifiedUsers } from "@/lib/cleanup";

// Rate limiting simples por IP: 5 tentativas em 15 min
// Armazena no globalThis de forma compatível com o padrão do projeto
const rateLimitMap: Map<string, {count: number; blockedUntil: number}> = new Map();

export const GET = async function cleanup(request: NextRequest) {
  const cleanupSecret = process.env.CLEANUP_SECRET;
  if (!cleanupSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("x-cleanup-secret");

  if (authHeader !== cleanupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const mapKey = ip;

  // Rate limit: 5 tentativas em 15 min
  const entry = rateLimitMap.get(mapKey) || { count: 0, blockedUntil: 0 };
  const now = Date.now();

  if (entry.blockedUntil && now < entry.blockedUntil) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil((entry.blockedUntil - now) / 60000)} minutes.` },
      { status: 429 }
    );
  }

  entry.count += 1;
  if (entry.count >= 5) {
    entry.blockedUntil = now + 15 * 60 * 1000;
  }
  rateLimitMap.set(mapKey, entry);

  const UNVERIFIED_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const count = await cleanupUnverifiedUsers(prisma, UNVERIFIED_MAX_AGE_MS);
    return NextResponse.json({ ok: true, deletedCount: count });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
};
