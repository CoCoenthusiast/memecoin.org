import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, isOwner } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

async function requireAdminOrOwner() {
  const session = await getSession();
  if (!session) return null;
  if (!isAdmin(session.user)) return null;
  return session;
}

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireAdminOrOwner();
  if (!session) return apiError("Unauthorized", 401);

  const { username } = await params;

  const target = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true, username: true, isBanned: true, isOwner: true, role: true },
  });
  if (!target) return apiError("User not found", 404);

  // Cannot ban owners
  if (target.isOwner) return apiError("Cannot ban an owner", 403);

  // Only owners can ban admins
  if (target.role === "ADMIN" && !isOwner(session.user)) {
    return apiError("Only owners can ban admins", 403);
  }

  // Cannot ban yourself
  if (target.id === session.user.id) return apiError("Cannot ban yourself", 403);

  const body = await getBody<{ ban: boolean; reason?: string }>(request);
  if (typeof body.ban !== "boolean") return apiError("ban must be a boolean", 400);

  // When banning, collect all unique IPs from LoginLog
  let bannedIps: string[] | undefined;
  if (body.ban) {
    const logs = await prisma.loginLog.findMany({
      where: { userId: target.id },
      select: { ip: true },
    });
    bannedIps = [...new Set(logs.map((l) => l.ip))];
  }

  const updateData: {
    isBanned: boolean;
    isBannedReason: string | null;
    tokenVersion: { increment: number };
    bannedIps?: string[];
  } = {
    isBanned: body.ban,
    isBannedReason: body.ban ? (body.reason || null) : null,
    tokenVersion: { increment: 1 },
  };
  if (body.ban) {
    updateData.bannedIps = bannedIps!;
  } else {
    updateData.bannedIps = [];
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: updateData,
    select: { id: true, isBanned: true, tokenVersion: true },
  });

  return NextResponse.json({
    ok: true,
    username: target.username,
    isBanned: updated.isBanned,
    tokenVersion: updated.tokenVersion,
    bannedIpsCount: body.ban ? bannedIps!.length : 0,
  });
});
