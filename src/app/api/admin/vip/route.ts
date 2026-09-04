import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { isUserVip } from "@/lib/vip";

const DAY_MS = 24 * 60 * 60 * 1000;
const VIP_DAYS = 30;
const ADD_MS = VIP_DAYS * DAY_MS;

type VipAction = "grant" | "renew" | "revoke";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user)) return apiError("Forbidden", 403);
  return null;
}

function serialize(user: {
  id: string;
  username: string;
  isVip: boolean;
  vipExpiresAt: Date | null;
}) {
  return {
    id: user.id,
    username: user.username,
    vipExpiresAt: user.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
    vip: isUserVip(user),
  };
}

export const GET = withErrorHandling(async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const username = (request.nextUrl.searchParams.get("username") ?? "").trim();
  if (!username) return apiError("username is required", 400);

  const user = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true, username: true, isVip: true, vipExpiresAt: true },
  });
  if (!user) return apiError("User not found", 404);

  return NextResponse.json({ user: serialize(user) });
});

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await getBody<{ action: VipAction; userId: string }>(request);
  if (!["grant", "renew", "revoke"].includes(body.action)) {
    return apiError("Invalid action", 400);
  }
  if (!body.userId) return apiError("userId is required", 400);

  const target = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true, username: true, isVip: true, vipExpiresAt: true },
  });
  if (!target) return apiError("User not found", 404);

  const now = Date.now();

  if (body.action === "grant") {
    await prisma.user.update({
      where: { id: body.userId },
      data: { isVip: true, vipExpiresAt: new Date(now + ADD_MS) },
    });
  } else if (body.action === "renew") {
    const base =
      target.vipExpiresAt && new Date(target.vipExpiresAt).getTime() > now
        ? new Date(target.vipExpiresAt).getTime()
        : now;
    await prisma.user.update({
      where: { id: body.userId },
      data: { isVip: true, vipExpiresAt: new Date(base + ADD_MS) },
    });
  } else if (body.action === "revoke") {
    await prisma.user.update({
      where: { id: body.userId },
      data: { isVip: false, vipExpiresAt: null },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true, username: true, isVip: true, vipExpiresAt: true },
  });
  if (!updated) return apiError("User not found", 404);

  return NextResponse.json({ user: serialize(updated) });
});
