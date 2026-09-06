import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

const VALID_TYPES = ["Like", "Dislike", "Funny", "Sad"] as const;

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const { user } = await requireAuth();

  const body = await getBody<{
    type: string;
    postId?: string;
    replyId?: string;
  }>(request);

  if (!VALID_TYPES.includes(body.type as typeof VALID_TYPES[number])) {
    return apiError("Invalid reaction type");
  }

  const hasPost = !!body.postId;
  const hasReply = !!body.replyId;

  if ((hasPost && hasReply) || (!hasPost && !hasReply)) {
    return apiError("Provide either postId or replyId, not both or neither");
  }

  let existing: { id: string; type: string } | null = null;

  if (hasPost) {
    existing = await prisma.reaction.findUnique({
      where: { userId_postId: { userId: user.id, postId: body.postId! } },
    });
  } else {
    existing = await prisma.reaction.findUnique({
      where: { userId_replyId: { userId: user.id, replyId: body.replyId! } },
    });
  }

  if (existing) {
    if (existing.type === body.type) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json(null);
    }

    const updated = await prisma.reaction.update({
      where: { id: existing.id },
      data: { type: body.type },
    });
    return NextResponse.json(updated);
  }

  const reaction = await prisma.reaction.create({
    data: {
      type: body.type,
      userId: user.id,
      postId: body.postId || null,
      replyId: body.replyId || null,
    },
  });

  // Intentional: fire-and-forget. Notificação de reação é secundária —
  // a reação já foi criada e retornada ao cliente normalmente.
  if (hasPost) {
    const post = await prisma.post.findUnique({
      where: { id: body.postId! },
      select: { authorId: true, id: true },
    });
    if (post && post.authorId !== user.id) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          actorId: user.id,
          postId: post.id,
          message: { contains: "reacted to your post" },
        },
        select: { id: true },
      });
      if (!alreadyNotified) {
        prisma.notification
          .create({
            data: {
              userId: post.authorId,
              actorId: user.id,
              postId: post.id,
              message: `${user.username} reacted to your post`,
            },
          })
          .catch((e) => {
            console.error("Failed to create reaction notification", e);
          });
      }
    }
  } else {
    const reply = await prisma.reply.findUnique({
      where: { id: body.replyId! },
      select: { authorId: true, postId: true },
    });
    if (reply && reply.authorId !== user.id) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          actorId: user.id,
          postId: reply.postId,
          message: { contains: "reacted to your comment" },
        },
        select: { id: true },
      });
      if (!alreadyNotified) {
        prisma.notification
          .create({
            data: {
              userId: reply.authorId,
              actorId: user.id,
              postId: reply.postId,
              message: `${user.username} reacted to your comment`,
            },
          })
          .catch((e) => {
            console.error("Failed to create reaction notification", e);
          });
      }
    }
  }

  return NextResponse.json(reaction, { status: 201 });
});
