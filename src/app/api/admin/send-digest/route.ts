import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";
import { MAX_EMAILS_PER_RUN, sendReplyDigestEmail, type ReplyDigestItem } from "@/lib/email";

async function requireOwnerOrDigestSecret(request: NextRequest) {
  const authHeader = request.headers.get("x-digest-secret");
  const session = await getSession();

  let authorized = false;

  if (authHeader && authHeader === process.env.DIGEST_SECRET) {
    authorized = true;
  } else if (session && session.user) {
    const { isOwner } = await import("@/lib/auth");
    if (isOwner(session.user)) {
      authorized = true;
    }
  }

  if (!authorized) {
    return apiError("Unauthorized", 401);
  }
  return null;
}

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  const denied = await requireOwnerOrDigestSecret(request);
  if (denied) return denied;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const eligibleUsers = await prisma.user.findMany({
    where: { emailNotificationsEnabled: true },
    select: { id: true, email: true, username: true },
  });

  let emailsSent = 0;
  let emailsSkipped = 0;
  const errors: string[] = [];

  if (eligibleUsers.length > MAX_EMAILS_PER_RUN) {
    console.warn(
      `[send-digest] WARNING: ${eligibleUsers.length} eligible users exceeds safe limit of ${MAX_EMAILS_PER_RUN}. Only first ${MAX_EMAILS_PER_RUN} will be processed.`
    );
  }

  const usersToProcess = eligibleUsers.slice(0, MAX_EMAILS_PER_RUN);

  for (const user of usersToProcess) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        postId: { not: null },
        message: { contains: "replied to your post" },
        createdAt: { gte: since },
      },
      select: {
        postId: true,
        actorId: true,
        actor: { select: { username: true } },
        post: { select: { id: true, title: true } },
      },
    });

    if (notifications.length === 0) {
      emailsSkipped++;
      continue;
    }

    const postMap = new Map<string, { postId: string; postTitle: string; actors: Map<string, { username: string; count: number }> }>();

    for (const n of notifications) {
      if (!n.post || !n.postId) continue;
      let entry = postMap.get(n.postId);
      if (!entry) {
        entry = { postId: n.postId, postTitle: n.post.title, actors: new Map() };
        postMap.set(n.postId, entry);
      }
      const actorEntry = entry.actors.get(n.actorId);
      if (actorEntry) {
        actorEntry.count++;
      } else {
        entry.actors.set(n.actorId, { username: n.actor.username, count: 1 });
      }
    }

    const digestItems: Array<{ postId: string; postTitle: string; actorUsername: string; count: number }> = [];
    for (const entry of postMap.values()) {
      const actors = Array.from(entry.actors.values());
      const primaryActor = actors[0];
      const totalCount = actors.reduce((sum, a) => sum + a.count, 0);
      const actorLabel = actors.length === 1
        ? primaryActor.username
        : actors.map((a) => a.username).join(", ");
      digestItems.push({
        postId: entry.postId,
        postTitle: entry.postTitle,
        actorUsername: actorLabel,
        count: totalCount,
      });
    }

    try {
      await sendReplyDigestEmail(user.email, user.username, digestItems);
      emailsSent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[send-digest] Failed to send to ${user.email}: ${msg}`);
      errors.push(`${user.email}: ${msg}`);
    }
  }

  const result = {
    eligibleUsers: eligibleUsers.length,
    processed: usersToProcess.length,
    emailsSent,
    emailsSkipped,
    errors,
  };

  console.log("[send-digest] Completed:", JSON.stringify(result));

  return NextResponse.json(result);
});
