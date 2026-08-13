import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const MAX_SIZE = 2 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withErrorHandling(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;

  const profile = await prisma.user.findUnique({ where: { username } });
  if (!profile) {
    return apiError("User not found", 404);
  }
  if (profile.id !== user.id) {
    return apiError("Forbidden", 403);
  }

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File)) {
    return apiError("No file provided");
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return apiError("Invalid file type. Only JPEG, PNG or WebP are allowed");
  }
  if (file.size > MAX_SIZE) {
    return apiError("File too large. Maximum size is 2MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const fileName = `${profile.id}.${ext}`;
  await writeFile(path.join(dir, fileName), buffer);

  const avatarUrl = `/uploads/avatars/${fileName}`;
  await prisma.user.update({
    where: { id: profile.id },
    data: { avatarUrl },
  });

  return NextResponse.json({ avatarUrl });
});
