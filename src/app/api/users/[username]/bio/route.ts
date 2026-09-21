import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireAuth();
  if (!session) return apiError("Unauthorized", 401);
  const { user } = session;

  const { username } = await params;
  if (user.username.toLowerCase() !== username.toLowerCase()) {
    return apiError("Forbidden", 403);
  }

  const body = await request.json();
  if (typeof body.bio !== "string") {
    return apiError("bio must be a string", 400);
  }

  const bio = body.bio.trim();
  if (bio.length > 54) {
    return apiError("Bio must be 54 characters or less", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { bio: bio || null },
  });

  return NextResponse.json({ bio: bio || null });
});
