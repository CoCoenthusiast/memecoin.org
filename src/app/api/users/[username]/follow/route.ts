import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;

  if (user.isBanned) return apiError("This account has been banned", 403);

  const target = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true, username: true, isBanned: true },
  });
  if (!target) return apiError("User not found", 404);
  if (target.isBanned) return apiError("User not found", 404);
  if (target.id === user.id) return apiError("Cannot follow yourself", 400);

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
  });
  if (existing) return NextResponse.json({ ok: true, following: true });

  await prisma.follow.create({
    data: { followerId: user.id, followingId: target.id },
  });

  prisma.notification.create({
    data: {
      userId: target.id,
      actorId: user.id,
      message: `${user.username} started following you`,
    },
  }).catch((e) => console.error("Failed to create follow notification", e));

  return NextResponse.json({ ok: true, following: true });
});

export const DELETE = withErrorHandling(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;

  const target = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true },
  });
  if (!target) return apiError("User not found", 404);

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId: target.id },
  });

  return NextResponse.json({ ok: true, following: false });
});
