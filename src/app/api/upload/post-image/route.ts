import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const { user } = await requireAuth();

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return apiError("No file provided");
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return apiError("Invalid file type. Only JPEG, PNG or WebP are allowed");
  }
  if (file.size > MAX_SIZE) {
    return apiError("File too large. Maximum size is 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "post-images");
  await mkdir(dir, { recursive: true });
  const fileName = `${user.id}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, fileName), buffer);

  const imageUrl = `/uploads/post-images/${fileName}`;
  return NextResponse.json({ imageUrl });
});
