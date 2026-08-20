import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth, isAdmin } from "@/lib/auth";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [post, replies, postReactions] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        channel: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.reply.findMany({
      where: { postId: id },
      include: {
        author: { select: { id: true, username: true } },
        reactions: { select: { id: true, type: true, userId: true } },
      },
    }),
    prisma.reaction.findMany({
      where: { postId: id },
      select: { id: true, type: true, userId: true },
    }),
  ]);

  if (!post) {
    return apiError("Post not found", 404);
  }

  prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({ ...post, replies, reactions: postReactions });
});

export const DELETE = withErrorHandling(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  if (!isAdmin(user)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  await prisma.report.updateMany({
    where: { postId: id },
    data: { status: "RESOLVED" },
  });
  await prisma.reply.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
