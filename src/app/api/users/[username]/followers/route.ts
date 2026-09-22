import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true },
  });
  if (!user) return apiError("User not found", 404);

  const follows = await prisma.follow.findMany({
    where: { followingId: user.id, follower: { isBanned: false } },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      follower: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          avatarPosX: true,
          avatarPosY: true,
          avatarZoom: true,
          nameStyle: true,
          isVip: true,
          vipExpiresAt: true,
          isOwner: true,
        },
      },
    },
  });

  const followers = follows.map((f) => ({
    ...f.follower,
    followedAt: f.createdAt,
  }));

  return NextResponse.json({ followers });
});
