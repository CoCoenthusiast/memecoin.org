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

  const reply = await prisma.reply.findUnique({ where: { id } });
  if (!reply) {
    return apiError("Reply not found", 404);
  }

  if (!isAdmin(user) && user.id !== reply.authorId) {
    return apiError("Forbidden", 403);
  }

  if (!isAdmin(user) && !withinDeleteWindow(reply.createdAt)) {
    return apiError("Deletion window has expired", 403);
  }

  await prisma.report.updateMany({
    where: { replyId: id },
    data: { status: "RESOLVED" },
  });
  await prisma.reply.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
