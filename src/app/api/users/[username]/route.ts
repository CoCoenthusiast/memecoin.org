import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const usernameLower = username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { usernameLower },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bannerUrl: true,
      nameStyle: true,
      isVip: true,
      vipExpiresAt: true,
      createdAt: true,
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          pinned: true,
          author: { select: { id: true, username: true, avatarUrl: true } },
          channel: { select: { slug: true, name: true } },
          _count: { select: { replies: true, reactions: true } },
        },
      },
      replies: {
        select: {
          _count: { select: { reactions: true } },
        },
      },
      _count: { select: { posts: true, replies: true } },
    },
  });

  if (!user) {
    return apiError("User not found", 404);
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
    nameStyle: user.nameStyle,
    isVip: user.isVip,
    vipExpiresAt: user.vipExpiresAt,
    createdAt: user.createdAt,
    postCount,
    replyCount,
    totalReactions,
    posts: user.posts,
  });
});
