import { NextRequest, NextResponse } from "next/server";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "post-images";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const { user } = await requireAuth();

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return apiError("No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError("Invalid file type. Only JPEG, PNG or WebP are allowed");
  }
  if (file.size > MAX_SIZE) {
    return apiError("File too large. Maximum size is 5MB");
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const fileName = `${user.id}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    if (uploadError.message.includes("Bucket not found")) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
      const { error: retryError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, buffer, { contentType: file.type });
      if (retryError) {
        return apiError("Failed to upload image");
      }
    } else {
      return apiError("Failed to upload image");
    }
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({ imageUrl: urlData.publicUrl });
});
