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

  return NextResponse.json(reaction, { status: 201 });
});
