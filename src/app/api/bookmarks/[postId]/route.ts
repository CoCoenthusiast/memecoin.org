import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { user } = await requireAuth();
  const { postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  const bookmark = await prisma.bookmark.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    update: {},
    create: { userId: user.id, postId },
  });

  return NextResponse.json({ ok: true, id: bookmark.id }, { status: 201 });
});

export const DELETE = withErrorHandling(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { user } = await requireAuth();
  const { postId } = await params;

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (!bookmark) {
    return apiError("Bookmark not found", 404);
  }

  await prisma.bookmark.delete({ where: { id: bookmark.id } });

  return NextResponse.json({ ok: true });
});
