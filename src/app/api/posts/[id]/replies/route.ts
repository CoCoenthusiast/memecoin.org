import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  const { id } = await params;

  const body = await getBody<{ body: string }>(request);

  if (!body.body || body.body.length < 1) {
    return apiError("Body is required");
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  const reply = await prisma.reply.create({
    data: {
      body: body.body,
      authorId: user.id,
      postId: id,
    },
  });

  return NextResponse.json(reply, { status: 201 });
}
