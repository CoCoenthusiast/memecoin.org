import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET() {
  const { user } = await requireAuth();

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          editedAt: true,
          imageUrl: true,
          videoUrl: true,
          viewCount: true,
          pinned: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              nameStyle: true,
              isVip: true,
              vipExpiresAt: true,
              isOwner: true,
            },
          },
          channel: { select: { id: true, slug: true, name: true } },
          _count: { select: { replies: true, reactions: true } },
        },
      },
    },
  });

  return NextResponse.json({ bookmarks });
});
