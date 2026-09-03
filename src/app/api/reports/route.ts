import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

const VALID_REASONS = ["Spam", "Scam", "Offensive content", "Other"];

function notifyAdmins(message: string, postId: string, actorId: string) {
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) => {
      Promise.allSettled(
        admins.map((a) =>
          prisma.notification.create({
            data: { userId: a.id, actorId, postId, message },
          })
        )
      );
    })
    .catch((e) => console.error("Failed to notify admins of report", e));
}

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const { user } = await requireAuth();

  const body = await getBody<{
    reason: string;
    postId?: string;
    replyId?: string;
    reportedUserId?: string;
  }>(request);

  if (!VALID_REASONS.includes(body.reason)) {
    return apiError("Invalid reason");
  }

  const hasPost = !!body.postId;
  const hasReply = !!body.replyId;
  const hasUser = !!body.reportedUserId;

  if ([hasPost, hasReply, hasUser].filter(Boolean).length !== 1) {
    return apiError("Provide exactly one of postId, replyId or reportedUserId");
  }

  if (hasPost) {
    const post = await prisma.post.findUnique({ where: { id: body.postId! } });
    if (!post) {
      return apiError("Post not found", 404);
    }
    if (post.authorId === user.id) {
      return apiError("You cannot report your own content");
    }

    const existing = await prisma.report.findUnique({
      where: { reporterId_postId: { reporterId: user.id, postId: body.postId! } },
    });
    if (existing) {
      return apiError("You have already reported this post", 409);
    }

    const report = await prisma.report.create({
      data: {
        reason: body.reason,
        reporterId: user.id,
        postId: body.postId,
      },
    });
    notifyAdmins(`${user.username} reported a post: "${post.title}"`, body.postId!, user.id);
    return NextResponse.json(report, { status: 201 });
  }

  if (hasReply) {
    const reply = await prisma.reply.findUnique({
      where: { id: body.replyId! },
      select: { authorId: true, post: { select: { id: true, title: true } } },
    });
    if (!reply) {
      return apiError("Reply not found", 404);
    }
    if (reply.authorId === user.id) {
      return apiError("You cannot report your own content");
    }

    const existing = await prisma.report.findUnique({
      where: { reporterId_replyId: { reporterId: user.id, replyId: body.replyId! } },
    });
    if (existing) {
      return apiError("You have already reported this reply", 409);
    }

    const report = await prisma.report.create({
      data: {
        reason: body.reason,
        reporterId: user.id,
        replyId: body.replyId,
      },
    });
    notifyAdmins(
      `${user.username} reported a reply on post "${reply.post.title}"`,
      reply.post.id,
      user.id
    );
    return NextResponse.json(report, { status: 201 });
  }

  if (body.reportedUserId === user.id) {
    return apiError("You cannot report yourself");
  }

  const reportedUser = await prisma.user.findUnique({
    where: { id: body.reportedUserId! },
  });
  if (!reportedUser) {
    return apiError("User not found", 404);
  }

  const existing = await prisma.report.findUnique({
    where: {
      reporterId_reportedUserId: {
        reporterId: user.id,
        reportedUserId: body.reportedUserId!,
      },
    },
  });
  if (existing) {
    return apiError("You have already reported this user", 409);
  }

  const report = await prisma.report.create({
    data: {
      reason: body.reason,
      reporterId: user.id,
      reportedUserId: body.reportedUserId,
    },
  });
  return NextResponse.json(report, { status: 201 });
});
