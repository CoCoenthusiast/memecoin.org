import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { getSession } from "@/lib/auth";

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
      createdAt: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      message: n.message,
      read: n.read,
      postId: n.postId,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
});
