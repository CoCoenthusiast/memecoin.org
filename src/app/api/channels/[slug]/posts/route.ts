import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user } = await requireAuth();
  const { slug } = await params;

  const body = await getBody<{ title: string; body: string }>(request);

  if (!body.title || body.title.length < 1 || body.title.length > 200) {
    return apiError("Title must be between 1 and 200 characters");
  }

  if (!body.body || body.body.length < 1 || body.body.length > 10000) {
    return apiError("Body must be between 1 and 10000 characters");
  }

  const channel = await prisma.channel.findUnique({ where: { slug } });
  if (!channel) {
    return apiError("Channel not found", 404);
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      body: body.body,
      authorId: user.id,
      channelId: channel.id,
    },
  });

  return NextResponse.json(post, { status: 201 });
});
