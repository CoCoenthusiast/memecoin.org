import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { isUserVip, isUserOwner } from "@/lib/vip";
import { canAccessVipChannel } from "@/lib/vipChannel";

export const GET = withErrorHandling(async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthorized", 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      message: true,
      read: true,
      postId: true,
      profileCommentId: true,
      createdAt: true,
      actor: {
        select: { username: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true, avatarUrl: true, avatarPosX: true, avatarPosY: true, avatarZoom: true },
      },
      profileComment: {
        select: { profileUser: { select: { username: true } } },
      },
      post: {
        select: { channelId: true },
      },
    },
  });

  // Filter out notifications referencing VIP Lounge posts for non-VIP users
  const isVip = await canAccessVipChannel();
  const vipChannel = isVip ? null : await prisma.channel.findUnique({ where: { slug: "vip-lounge" }, select: { id: true } });

  const filtered = vipChannel
    ? notifications.filter((n) => !n.post || n.post.channelId !== vipChannel.id)
    : notifications;

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    notifications: filtered.map((n) => ({
      id: n.id,
      message: n.message,
      read: n.read,
      postId: n.postId,
      profileCommentId: n.profileCommentId,
      profileUsername: n.profileComment?.profileUser.username ?? null,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor
        ? {
            username: n.actor.username,
            nameStyle: n.actor.nameStyle,
            isVip: isUserVip(n.actor),
            isOwner: isUserOwner(n.actor),
          }
        : null,
    })),
    unreadCount,
  });
});
