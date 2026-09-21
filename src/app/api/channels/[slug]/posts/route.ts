import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { notifyMentions } from "@/lib/mentions";
import { notifyAtAll } from "@/lib/notifyAll";
import { isUserVip } from "@/lib/vip";
import { VIP_CHANNEL_SLUG } from "@/lib/constants";

function isValidSupabaseUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === "https:" && url.host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user } = await requireAuth();
  const { slug } = await params;

  if (user.isBanned) return apiError("This account has been banned", 403);

  if (!user.emailVerified) {
    return apiError("Please verify your email before posting", 403);
  }

  const body = await getBody<{ title: string; body: string; imageUrl?: string; videoUrl?: string }>(request);

  if (!body.title || body.title.length < 1 || body.title.length > 200) {
    return apiError("Title must be between 1 and 200 characters");
  }

  if (!body.body || body.body.trim().length < 10 || body.body.length > 10000) {
    return apiError("Please write a message of at least 10 characters");
  }

  if (body.imageUrl && body.videoUrl) {
    return apiError("Cannot attach both an image and a video");
  }

  if (body.imageUrl && !isValidSupabaseUrl(body.imageUrl)) {
    console.error("Invalid image URL rejected:", body.imageUrl);
    return apiError("Invalid image URL");
  }

  if (body.videoUrl) {
    if (!isValidSupabaseUrl(body.videoUrl)) {
      console.error("Invalid video URL rejected:", body.videoUrl);
      return apiError("Invalid video URL");
    }
    if (slug !== "pnl-flex" && slug !== VIP_CHANNEL_SLUG) {
      return apiError("Videos are only allowed in PnL Flex and VIP Lounge");
    }
  }

  const channel = await prisma.channel.findUnique({ where: { slug } });
  if (!channel) {
    return apiError("Channel not found", 404);
  }

  // VIP Lounge is restricted to VIP users
  if (slug === VIP_CHANNEL_SLUG) {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isVip: true, vipExpiresAt: true },
    });
    if (!fullUser || !isUserVip(fullUser)) {
      return apiError("VIP Lounge is exclusive to VIP members", 403);
    }
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl || null,
      videoUrl: body.videoUrl || null,
      authorId: user.id,
      channelId: channel.id,
    },
  });

  notifyMentions(body.body, { id: user.id, username: user.username }, post.id, "post");

  notifyAtAll(body.body, { id: user.id, username: user.username, role: user.role, isOwner: user.isOwner }, post.id, channel.id, "post");

  return NextResponse.json(post, { status: 201 });
});
