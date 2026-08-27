import { NextRequest, NextResponse } from "next/server";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const BUCKET = "post-videos";

async function ensureBucketPublic() {
  const { error } = await supabaseAdmin.storage.updateBucket(BUCKET, { public: true });
  if (error && error.message.includes("Bucket not found")) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError("Invalid file type. Only MP4, WebM or QuickTime are allowed");
  }
  if (file.size > MAX_SIZE) {
    return apiError("File too large. Maximum size is 1MB");
  }

  await ensureBucketPublic();

  const ext = file.type === "video/mp4" ? "mp4" : file.type === "video/webm" ? "webm" : "mov";
  const fileName = `${user.id}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return apiError("Failed to upload video");
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({ videoUrl: urlData.publicUrl });
});
