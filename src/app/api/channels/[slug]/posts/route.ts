import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user } = await requireAuth();
  const { slug } = await params;

  const body = await getBody<{ title: string; body: string; imageUrl?: string }>(request);

  if (!body.title || body.title.length < 1 || body.title.length > 200) {
    return apiError("Title must be between 1 and 200 characters");
  }

  if (!body.body || body.body.length < 1 || body.body.length > 10000) {
    return apiError("Body must be between 1 and 10000 characters");
  }

  if (body.imageUrl) {
    try {
      const url = new URL(body.imageUrl);
      const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "";
      if (url.protocol !== "https:" || url.host !== supabaseHost) {
        return apiError("Invalid image URL");
      }
    } catch {
      return apiError("Invalid image URL");
    }
  }

  const channel = await prisma.channel.findUnique({ where: { slug } });
  if (!channel) {
    return apiError("Channel not found", 404);
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl || null,
      authorId: user.id,
      channelId: channel.id,
    },
  });

  return NextResponse.json(post, { status: 201 });
});
