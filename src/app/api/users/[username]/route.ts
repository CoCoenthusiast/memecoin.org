import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          channel: { select: { slug: true, name: true } },
          _count: { select: { replies: true, reactions: true } },
        },
      },
    },
  });

  if (!user) {
    return apiError("User not found", 404);
  }

  const postReactions = await prisma.reaction.count({
    where: { post: { authorId: user.id } },
  });
  const replyReactions = await prisma.reaction.count({
    where: { reply: { authorId: user.id } },
  });
  const totalReactions = postReactions + replyReactions;

  return NextResponse.json({
    ...user,
    totalReactions,
  });
}
