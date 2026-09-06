import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAdmin } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { notifyMentions } from "@/lib/mentions";
import { isWithinWindow, DELETE_WINDOW_MS, EDIT_WINDOW_MS } from "@/lib/deleteWindow";

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  const { id } = await params;

  const body = await getBody<{ body: string; parentId?: string }>(request);

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

  let parentReply: { id: string; authorId: string } | null = null;
  if (body.parentId) {
    parentReply = await prisma.reply.findFirst({
      where: { id: body.parentId, postId: id },
      select: { id: true, authorId: true },
    });
    if (!parentReply) {
      return apiError("Parent reply not found", 404);
    }
  }

  const reply = await prisma.reply.create({
    data: {
      body: body.body,
      authorId: user.id,
      postId: id,
      parentId: body.parentId || null,
    },
  });

  if (body.parentId && parentReply) {
    if (parentReply.authorId !== user.id) {
      // Intentional: fire-and-forget. Notificação ao autor do comentário pai é
      // secundária — se falhar, o reply foi criado e retornado ao cliente normalmente.
      prisma.notification
        .create({
          data: {
            userId: parentReply.authorId,
            actorId: user.id,
            postId: id,
            message: `${user.username} replied to your comment`,
          },
        })
        .catch((e) => {
          console.error("Failed to create reply notification", e);
        });
    }
  } else if (post.authorId !== user.id) {
    // Intentional: fire-and-forget. Notificação ao autor do post é secundária —
    // o reply já está criado e o cliente recebe a resposta imediatamente.
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

  notifyMentions(body.body, { id: user.id, username: user.username }, id, "comment");

  // Intentional: fire-and-forget. lastActivityAt é metadata de ordenação —
  // se falhar, o post ainda existe com o novo reply; apenas a posição na
  // lista ficará ligeiramente dessincronizada até a próxima atividade.
  prisma.post.update({ where: { id }, data: { lastActivityAt: new Date() } }).catch((e) => {
    console.error("Failed to update post lastActivityAt", e);
  });

  return NextResponse.json(reply, { status: 201 });
});

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

  if (!isAdmin(user) && !isWithinWindow(reply.createdAt, DELETE_WINDOW_MS)) {
    return apiError("Deletion window has expired", 403);
  }

  await prisma.report.updateMany({
    where: { replyId: id },
    data: { status: "RESOLVED" },
  });
  await prisma.reply.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
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

  if (!isAdmin(user) && !isWithinWindow(reply.createdAt, EDIT_WINDOW_MS)) {
    return apiError("Edit window has expired (5 minutes)", 403);
  }

  const body = await getBody<{ body: string }>(request);
  if (!body || typeof body.body !== "string") {
    return apiError("Body is required");
  }

  if (body.body.length < 1 || body.body.length > 10000) {
    return apiError("Body must be between 1 and 10000 characters");
  }

  const updated = await prisma.reply.update({
    where: { id },
    data: { body: body.body, editedAt: new Date() },
  });

  return NextResponse.json(updated);
});
