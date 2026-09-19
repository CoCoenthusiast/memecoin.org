import { NextRequest, NextResponse } from "next/server";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isUserVip } from "@/lib/vip";
import { prisma } from "@/lib/db";
import { VIP_CHANNEL_SLUG } from "@/lib/constants";

const DEFAULT_MAX_SIZE = 1 * 1024 * 1024; // 1MB
const VIP_MAX_SIZE = 5 * 1024 * 1024; // 5MB for VIP Lounge
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const BUCKET = "post-videos";

async function ensureBucketPublic() {
  const { error } = await getSupabaseAdmin().storage.updateBucket(BUCKET, { public: true });
  if (error && error.message.includes("Bucket not found")) {
    await getSupabaseAdmin().storage.createBucket(BUCKET, { public: true });
  }
}

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const { user } = await requireAuth();

  const form = await request.formData();
  const file = form.get("video");
  if (!(file instanceof File)) {
    return apiError("No file provided");
  }

  const channelSlug = form.get("channelSlug");

  // Determine max size: 5MB for VIP Lounge, 1MB for others
  let maxSize = DEFAULT_MAX_SIZE;
  if (channelSlug === VIP_CHANNEL_SLUG) {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isVip: true, vipExpiresAt: true },
    });
    if (fullUser && isUserVip(fullUser)) {
      maxSize = VIP_MAX_SIZE;
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError("Invalid file type. Only MP4, WebM or QuickTime are allowed");
  }
  if (file.size > maxSize) {
    const maxMb = maxSize === VIP_MAX_SIZE ? "5MB" : "1MB";
    return apiError(`File too large. Maximum size is ${maxMb}`);
  }

  await ensureBucketPublic();

  const ext = file.type === "video/mp4" ? "mp4" : file.type === "video/webm" ? "webm" : "mov";
  const fileName = `${user.id}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return apiError("Failed to upload video");
  }

  const { data: urlData } = getSupabaseAdmin().storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({ videoUrl: urlData.publicUrl });
});
