import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { vipChannelFilter } from "@/lib/vipChannel";
import { getSession } from "@/lib/auth";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const usernameLower = username.toLowerCase();
  const vipFilter = await vipChannelFilter();

  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { usernameLower },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      avatarPosX: true,
      avatarPosY: true,
      avatarZoom: true,
      bannerUrl: true,
      bannerPosX: true,
      bannerPosY: true,
      bannerZoom: true,
      nameStyle: true,
      isVip: true,
      vipExpiresAt: true,
      isOwner: true,
      bio: true,
      isBanned: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          replies: true,
          followers: true,
          following: true,
        },
      },
      posts: {
        where: vipFilter,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          channelId: true,
          title: true,
          body: true,
          createdAt: true,
          editedAt: true,
          pinned: true,
          author: { select: { id: true, username: true, avatarUrl: true, avatarPosX: true, avatarPosY: true, avatarZoom: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true } },
          _count: { select: { reactions: true, replies: true } },
        },
      },
      replies: {
        select: {
          _count: { select: { reactions: true } },
        },
      },
    },
  });

  if (!user || user.isBanned) {
    return apiError("User not found", 404);
  }

  let isFollowing = false;
  if (session) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  const postCount = user._count.posts;
  const replyCount = user._count.replies;
  const postReactions = user.posts.reduce((sum, p) => sum + p._count.reactions, 0);
  const replyReactions = user.replies.reduce((sum, r) => sum + r._count.reactions, 0);
  const totalReactions = postReactions + replyReactions;

  return NextResponse.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    avatarPosX: user.avatarPosX,
    avatarPosY: user.avatarPosY,
    avatarZoom: user.avatarZoom,
    bannerPosX: user.bannerPosX,
    bannerPosY: user.bannerPosY,
    bannerZoom: user.bannerZoom,
    nameStyle: user.nameStyle,
    bio: user.bio,
    isVip: user.isVip,
    vipExpiresAt: user.vipExpiresAt,
    isOwner: user.isOwner,
    createdAt: user.createdAt,
    postCount,
    replyCount,
    totalReactions,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing,
    posts: user.posts,
  });
});
