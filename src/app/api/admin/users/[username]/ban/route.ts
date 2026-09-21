import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, isOwner } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

async function requireAdminOrOwner() {
  const session = await getSession();
  if (!session) return null;
  if (!isAdmin(session.user)) return null;
  return session;
}

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireAdminOrOwner();
  if (!session) return apiError("Unauthorized", 401);

  const { username } = await params;

  const target = await prisma.user.findUnique({
    where: { usernameLower: username.toLowerCase() },
    select: { id: true, username: true, isBanned: true, isOwner: true, role: true },
  });
  if (!target) return apiError("User not found", 404);

  if (target.isOwner) return apiError("Cannot ban an owner", 403);
  if (target.role === "ADMIN" && !isOwner(session.user)) {
    return apiError("Only owners can ban admins", 403);
  }
  if (target.id === session.user.id) return apiError("Cannot ban yourself", 403);

  const body = await getBody<{ ban: boolean; reason?: string }>(request);
  if (typeof body.ban !== "boolean") return apiError("ban must be a boolean", 400);

  const targetId = target.id;

  // Collect IPs before anything else
  let bannedIps: string[] = [];
  if (body.ban) {
    const logs = await prisma.loginLog.findMany({
      where: { userId: targetId },
      select: { ip: true },
    });
    bannedIps = [...new Set(logs.map((l) => l.ip))];
  }

  // When banning: delete all user content in a single transaction.
  // FK deletion order matters — most relations are Restrict, not Cascade.
  if (body.ban) {
    await prisma.$transaction(async (tx) => {
      // 1) Reactions on user's posts (Reaction.postId → Post: Restrict)
      await tx.reaction.deleteMany({
        where: { post: { authorId: targetId } },
      });

      // 2) Reports referencing user's posts (Report.postId → Post: Restrict)
      await tx.report.deleteMany({
        where: { post: { authorId: targetId } },
      });

      // 3) Bookmarks on user's posts (handled by Cascade, but explicit for safety)
      await tx.bookmark.deleteMany({
        where: { post: { authorId: targetId } },
      });

      // 4) Replies on user's posts (Reply.postId → Post: Restrict)
      //    Must go before post deletion. Also deletes other users' replies.
      await tx.reply.deleteMany({
        where: { post: { authorId: targetId } },
      });

      // 5) Reports referencing user's replies (Report.replyId → Reply: Restrict)
      await tx.report.deleteMany({
        where: { reply: { authorId: targetId } },
      });

      // 6) Reactions on user's replies (Reaction.replyId → Reply: Restrict)
      await tx.reaction.deleteMany({
        where: { reply: { authorId: targetId } },
      });

      // 7) User's own replies on OTHER people's posts (Reply.authorId: Restrict)
      await tx.reply.deleteMany({
        where: { authorId: targetId },
      });

      // 8) Reactions on user's profile comments (Reaction.profileCommentId: Restrict)
      await tx.reaction.deleteMany({
        where: { profileComment: { authorId: targetId } },
      });

      // 9) Notifications referencing user's profile comments
      //    (Notification.profileCommentId: Cascade, but explicit before delete)
      await tx.notification.deleteMany({
        where: { profileComment: { authorId: targetId } },
      });

      // 10) Profile comments written BY user on OTHER profiles
      //     (ProfileComment.authorId: Restrict)
      await tx.profileComment.deleteMany({
        where: { authorId: targetId },
      });

      // 11) Profile comments written by OTHERS on user's profile
      //     (ProfileComment.profileUserId: Restrict)
      await tx.profileComment.deleteMany({
        where: { profileUserId: targetId },
      });

      // 12) User's own posts (Post.authorId: Restrict)
      //     Replies/reactions already cleared above.
      await tx.post.deleteMany({
        where: { authorId: targetId },
      });

      // 13) Reports filed by user (Report.reporterId: Restrict)
      await tx.report.deleteMany({
        where: { reporterId: targetId },
      });

      // 14) Reports targeting user (Report.reportedUserId: Restrict)
      await tx.report.deleteMany({
        where: { reportedUserId: targetId },
      });

      // 15) User's reactions on other content (Reaction.userId: Restrict)
      await tx.reaction.deleteMany({
        where: { userId: targetId },
      });

      // 16) Notifications sent by user (Notification.actorId: Cascade, explicit)
      await tx.notification.deleteMany({
        where: { actorId: targetId },
      });

      // 17) Notifications for user (Notification.userId: Cascade, explicit)
      await tx.notification.deleteMany({
        where: { userId: targetId },
      });

      // 18) Login logs (LoginLog.userId: Restrict)
      await tx.loginLog.deleteMany({
        where: { userId: targetId },
      });

      // 19) Ban the user + clear tokens
      await tx.user.update({
        where: { id: targetId },
        data: {
          isBanned: true,
          isBannedReason: body.reason || null,
          bannedIps,
          tokenVersion: { increment: 1 },
        },
      });
    });
  } else {
    // Unbanning — no content deletion
    await prisma.user.update({
      where: { id: targetId },
      data: {
        isBanned: false,
        isBannedReason: null,
        bannedIps: [],
        tokenVersion: { increment: 1 },
      },
    });
  }

  return NextResponse.json({
    ok: true,
    username: target.username,
    isBanned: body.ban,
    bannedIpsCount: body.ban ? bannedIps.length : 0,
  });
});
