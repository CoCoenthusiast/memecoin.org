import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { notifyMentions } from "@/lib/mentions";

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
