import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  const { id } = await params;

  const body = await getBody<{ body: string }>(request);

  if (!body.body || body.body.length < 1) {
    return apiError("Body is required");
  }
  if (body.body.length > 10000) {
    return apiError("Body must be at most 10000 characters");
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

  if (post.authorId !== user.id) {
    prisma.notification
      .create({
        data: {
          userId: post.authorId,
          actorId: user.id,
          postId: id,
          message: `${user.username} replied to your post "${post.title}"`,
        },
      })
      .catch((e) => {
        console.error("Failed to create notification", e);
      });
  }

  prisma.post.update({ where: { id }, data: { lastActivityAt: new Date() } }).catch((e) => {
    console.error("Failed to update post lastActivityAt", e);
  });

  return NextResponse.json(reply, { status: 201 });
});
