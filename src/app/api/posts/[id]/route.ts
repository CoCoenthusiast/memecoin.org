import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth, isAdmin } from "@/lib/auth";
import { isWithinWindow, DELETE_WINDOW_MS, EDIT_WINDOW_MS } from "@/lib/deleteWindow";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [post, replies, postReactions] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        channelId: true,
        title: true,
        body: true,
        imageUrl: true,
        videoUrl: true,
        createdAt: true,
        editedAt: true,
        viewCount: true,
        pinned: true,
        author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true } },
        channel: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.reply.findMany({
      where: { postId: id },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true } },
        parent: { select: { id: true, body: true, author: { select: { username: true } } } },
        reactions: { select: { id: true, type: true, userId: true } },
      },
    }),
    prisma.reaction.findMany({
      where: { postId: id },
      select: { id: true, type: true, userId: true },
    }),
  ]);

  if (!post) {
    return apiError("Post not found", 404);
  }

  prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch((e) => {
    console.error("Failed to increment view count", e);
  });

  return NextResponse.json({ ...post, replies, reactions: postReactions });
});

export const DELETE = withErrorHandling(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();

  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  if (!isAdmin(user) && user.id !== post.authorId) {
    return apiError("Forbidden", 403);
  }

  if (!isAdmin(user) && !isWithinWindow(post.createdAt, DELETE_WINDOW_MS)) {
    return apiError("Deletion window has expired", 403);
  }

  await prisma.report.updateMany({
    where: { postId: id },
    data: { status: "RESOLVED" },
  });
  await prisma.reply.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return apiError("Post not found", 404);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("Invalid request body");
  }

  const hasChannelId = typeof body.channelId === "string" && body.channelId.length > 0;
  const hasBody = typeof body.body === "string";

  if (!hasChannelId && !hasBody) {
    return apiError("Provide channelId and/or body to update");
  }

  // channelId change is admin-only
  if (hasChannelId && !isAdmin(user)) {
    return apiError("Only admins can move posts between channels", 403);
  }

  // body edit requires ownership or admin, plus edit window check
  if (hasBody && !isAdmin(user)) {
    if (user.id !== post.authorId) {
      return apiError("Forbidden", 403);
    }
    if (!isWithinWindow(post.createdAt, EDIT_WINDOW_MS)) {
      return apiError("Edit window has expired (5 minutes)", 403);
    }
  }

  if (hasBody) {
    if (body.body.trim().length < 10 || body.body.length > 10000) {
      return apiError("Body must be between 10 and 10000 characters");
    }
  }

  if (hasChannelId) {
    const channel = await prisma.channel.findUnique({ where: { id: body.channelId } });
    if (!channel) {
      return apiError("Channel not found", 404);
    }
  }

  const data: Record<string, unknown> = {};
  if (hasBody) {
    data.body = body.body;
    data.editedAt = new Date();
  }
  if (hasChannelId) {
    data.channelId = body.channelId;
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
});
