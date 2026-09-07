import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, isOwner } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";

async function requireOwner() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user) || !isOwner(session.user)) return apiError("Forbidden", 403);
  return null;
}

export const GET = withErrorHandling(async function GET(_request: NextRequest) {
  const denied = await requireOwner();
  if (denied) return denied;

  const logs = await prisma.loginLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      ip: true,
      createdAt: true,
      user: {
        select: { id: true, username: true },
      },
    },
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      username: log.user.username,
      ip: log.ip,
      createdAt: log.createdAt.toISOString(),
    })),
  });
});
