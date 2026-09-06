import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth, isAdmin } from "@/lib/auth";
import { withinDeleteWindow, withinEditWindow } from "@/lib/deleteWindow";

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

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
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

  if (!isAdmin(user) && !withinEditWindow(comment.createdAt)) {
    return apiError("Edit window has expired (5 minutes)", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.body !== "string") {
    return apiError("Body is required");
  }

  if (body.body.trim().length === 0 || body.body.length > 1000) {
    return apiError("Comment must be between 1 and 1000 characters");
  }

  const updated = await prisma.profileComment.update({
    where: { id },
    data: { body: body.body, editedAt: new Date() },
  });

  return NextResponse.json(updated);
});
