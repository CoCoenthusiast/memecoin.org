import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { getSession, isAdmin } from "@/lib/auth";

export const POST = withErrorHandling(async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthorized", 401);
  }
  if (!isAdmin(session.user)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { pinned: !post.pinned },
  });

  return NextResponse.json({ pinned: updated.pinned });
});
