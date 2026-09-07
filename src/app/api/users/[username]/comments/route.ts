import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const GET = withErrorHandling(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const usernameLower = username.toLowerCase();

  const profile = await prisma.user.findUnique({
    where: { usernameLower },
  });
  if (!profile) {
    return apiError("User not found", 404);
  }

  const comments = await prisma.profileComment.findMany({
    where: { profileUserId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      editedAt: true,
      author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true } },
      reactions: { select: { id: true, type: true, userId: true } },
    },
  });

  return NextResponse.json(comments);
});

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;
  const usernameLower = username.toLowerCase();

  const profile = await prisma.user.findUnique({
    where: { usernameLower },
  });
  if (!profile) {
    return apiError("User not found", 404);
  }

  const body = await getBody<{ body: string }>(request);
  if (!body.body || body.body.trim().length === 0) {
    return apiError("Comment is required");
  }
  if (body.body.length > 1000) {
    return apiError("Comment must be at most 1000 characters");
  }

  const comment = await prisma.profileComment.create({
    data: {
      body: body.body.trim(),
      authorId: user.id,
      profileUserId: profile.id,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      editedAt: true,
      author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true, isOwner: true } },
    },
  });

  // Intentional: fire-and-forget. Notificação de comment no mural é secundária —
  // o comment já foi criado e retornado ao cliente normalmente, independentemente
  // de a notificação falhar.
  if (profile.id !== user.id) {
    prisma.notification
      .create({
        data: {
          userId: profile.id,
          actorId: user.id,
          profileCommentId: comment.id,
          message: `${user.username} left a comment on your wall`,
        },
      })
      .catch((e) => {
        console.error("Failed to create profile comment notification", e);
      });
  }

  return NextResponse.json(comment, { status: 201 });
});
