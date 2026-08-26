import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: {
      posts: {
        orderBy: { lastActivityAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          imageUrl: true,
          createdAt: true,
          viewCount: true,
          author: { select: { id: true, username: true } },
          _count: { select: { replies: true, reactions: true } },
        },
      },
    },
  });

  if (!channel) {
    return apiError("Channel not found", 404);
  }

  return NextResponse.json(channel);
});
