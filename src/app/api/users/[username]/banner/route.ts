import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isUserVip } from "@/lib/vip";

const MAX_SIZE = 2 * 1024 * 1024;
const MAX_SIZE_VIP = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIP_ALLOWED_TYPES = [...ALLOWED_TYPES, "image/gif"];
const BUCKET = "profile-banners";

async function ensureBucketPublic() {
  const { error } = await supabaseAdmin.storage.updateBucket(BUCKET, { public: true });
  if (error && error.message.includes("Bucket not found")) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  }
}

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;
  const usernameLower = username.toLowerCase();

  const profile = await prisma.user.findUnique({
    where: { usernameLower },
  });
  if (!profile) {
    return apiError("User not found", 404);
  }
  if (profile.id !== user.id) {
    return apiError("Forbidden", 403);
  }

  if (!isUserVip(user)) {
    return apiError("VIP is required to upload a banner", 403);
  }

  const form = await request.formData();
  const file = form.get("banner");
  if (!(file instanceof File)) {
    return apiError("No file provided");
  }

  const isVip = isUserVip(user);
  const allowedTypes = isVip ? VIP_ALLOWED_TYPES : ALLOWED_TYPES;
  const maxSize = isVip ? MAX_SIZE_VIP : MAX_SIZE;

  if (!allowedTypes.includes(file.type)) {
    return apiError(
      isVip
        ? "Invalid file type. Only JPEG, PNG, WebP or GIF are allowed"
        : "Invalid file type. Only JPEG, PNG or WebP are allowed"
    );
  }
  if (file.size > maxSize) {
    return apiError(
      isVip ? "File too large. Maximum size is 5MB" : "File too large. Maximum size is 2MB"
    );
  }

  await ensureBucketPublic();

  const ext =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/gif"
          ? "gif"
          : "webp";
  const fileName = `${user.id}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return apiError("Failed to upload banner");
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  const bannerUrl = urlData.publicUrl;
  await prisma.user.update({
    where: { id: profile.id },
    data: { bannerUrl },
  });

  return NextResponse.json({ bannerUrl });
});
