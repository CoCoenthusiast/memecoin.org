import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true } },
      channel: { select: { id: true, slug: true, name: true } },
      replies: {
        include: {
          author: { select: { id: true, username: true } },
          reactions: { select: { id: true, type: true, userId: true } },
        },
      },
      reactions: { select: { id: true, type: true, userId: true } },
    },
  });

  if (!post) {
    return apiError("Post not found", 404);
  }

  return NextResponse.json(post);
}
