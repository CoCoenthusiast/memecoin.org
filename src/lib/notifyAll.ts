import { prisma } from "@/lib/db";
import { isUserVip } from "@/lib/vip";
import { VIP_CHANNEL_SLUG } from "@/lib/constants";
import { sendAtAllEmail } from "@/lib/email";

function containsAtAll(text: string): boolean {
  return /@all\b/i.test(text);
}

export async function notifyAtAll(
  text: string,
  actor: { id: string; username: string; role: string; isOwner: boolean },
  postId: string,
  channelId: string,
  kind: "post" | "comment"
) {
  if (!containsAtAll(text)) return;
  if (actor.role !== "ADMIN" && !actor.isOwner) return;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, slug: true },
  });
  if (!channel) return;

  const isVipChannel = channel.slug === VIP_CHANNEL_SLUG;

  // Find eligible users: all users for normal channels, VIP-only for VIP Lounge
  let targetUsers: { id: string; email: string }[];

  if (isVipChannel) {
    const allUsers = await prisma.user.findMany({
      where: { id: { not: actor.id } },
      select: { id: true, email: true, isVip: true, vipExpiresAt: true },
    });
    targetUsers = allUsers.filter((u) => isUserVip(u));
  } else {
    targetUsers = await prisma.user.findMany({
      where: { id: { not: actor.id } },
      select: { id: true, email: true },
    });
  }

  if (targetUsers.length === 0) return;

  const message = `${actor.username} mentioned everyone in a ${kind}`;

  // Create one notification per user — targetUsers is already unique (DB query by id)
  await prisma.notification.createMany({
    data: targetUsers.map((u) => ({
      userId: u.id,
      actorId: actor.id,
      postId,
      message,
    })),
  });

  // Send emails to all notified users (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${appUrl}/p/${postId}`;

  Promise.allSettled(
    targetUsers.map((u) =>
      sendAtAllEmail(u.email, actor.username, kind, postUrl)
    )
  ).catch((e) => console.error("Failed to send @all emails", e));
}
