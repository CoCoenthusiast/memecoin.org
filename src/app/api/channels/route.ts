import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { isUserVip } from "@/lib/vip";
import { VIP_CHANNEL_SLUG } from "@/lib/constants";

export const GET = withErrorHandling(async function GET() {
  const channels = await prisma.channel.findMany({
    include: { _count: { select: { posts: true } } },
  });

  // Filter VIP Lounge for non-VIP users
  const session = await getSession();
  let isVip = false;
  if (session) {
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isVip: true, vipExpiresAt: true } });
    if (u) isVip = isUserVip(u);
  }

  const filtered = isVip
    ? channels
    : channels.filter((ch) => ch.slug !== VIP_CHANNEL_SLUG);

  return NextResponse.json(filtered);
});
