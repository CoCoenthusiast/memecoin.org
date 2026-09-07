import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";
import { isUserVip } from "@/lib/vip";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user)) return apiError("Forbidden", 403);
  return null;
}

export const GET = withErrorHandling(async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    where: { isVip: true },
    select: {
      id: true,
      username: true,
      isVip: true,
      vipExpiresAt: true,
      createdAt: true,
    },
    orderBy: [{ vipExpiresAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      isVip: isUserVip(u),
      vipExpiresAt: u.vipExpiresAt
        ? u.vipExpiresAt.toISOString()
        : null,
      lifetime: u.vipExpiresAt == null,
      createdAt: u.createdAt.toISOString(),
    })),
  });
});
