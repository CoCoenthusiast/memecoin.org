import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: {
      posts: {
        include: {
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
}
