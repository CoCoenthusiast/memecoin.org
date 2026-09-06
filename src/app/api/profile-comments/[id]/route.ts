import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth, isAdmin } from "@/lib/auth";
import { withinDeleteWindow } from "@/lib/deleteWindow";

export const DELETE = withErrorHandling(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();

  const { id } = await params;

  const comment = await prisma.profileComment.findUnique({ where: { id } });
  if (!comment) {
    return apiError("Comment not found", 404);
  }

  if (!isAdmin(user) && user.id !== comment.authorId) {
    return apiError("Forbidden", 403);
  }

  if (!isAdmin(user) && !withinDeleteWindow(comment.createdAt)) {
    return apiError("Deletion window has expired", 403);
  }

  await prisma.profileComment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
