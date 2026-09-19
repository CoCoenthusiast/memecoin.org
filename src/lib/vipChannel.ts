import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isUserVip } from "@/lib/vip";
import { VIP_CHANNEL_SLUG } from "@/lib/constants";

/**
 * Checks if the current user has access to the VIP Lounge channel.
 * Returns true if the user is VIP (or owner), false otherwise.
 * Works with or without an authenticated session.
 */
export async function canAccessVipChannel(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isVip: true, vipExpiresAt: true, isOwner: true },
  });
  if (!user) return false;
  if (user.isOwner) return true;
  return isUserVip(user);
}

/**
 * Given a channel slug, returns true if access is allowed.
 * Blocks non-VIP users from accessing the VIP Lounge channel.
 */
export async function isChannelAccessible(slug: string): Promise<boolean> {
  if (slug !== VIP_CHANNEL_SLUG) return true;
  return canAccessVipChannel();
}

/**
 * Given a channelId, returns true if access is allowed.
 * Looks up the channel slug internally.
 */
export async function isChannelIdAccessible(channelId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { slug: true },
  });
  if (!channel) return true;
  return isChannelAccessible(channel.slug);
}

/**
 * Returns a Prisma where filter that excludes VIP Lounge posts.
 * Use this in any query that should not return VIP content to non-VIP users.
 */
export async function vipChannelFilter(): Promise<{ channelId?: { not: string } }> {
  const allowed = await canAccessVipChannel();
  if (allowed) return {};

  const vipChannel = await prisma.channel.findUnique({
    where: { slug: VIP_CHANNEL_SLUG },
    select: { id: true },
  });
  if (!vipChannel) return {};

  return { channelId: { not: vipChannel.id } };
}
