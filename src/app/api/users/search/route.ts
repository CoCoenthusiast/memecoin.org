import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) {
    return apiError("q is required", 400);
  }

  const users = await prisma.user.findMany({
    where: { usernameLower: { startsWith: q.toLowerCase() } },
    select: { id: true, username: true, avatarUrl: true },
    orderBy: { usernameLower: "asc" },
    take: 8,
  });

  return NextResponse.json({ users });
});
