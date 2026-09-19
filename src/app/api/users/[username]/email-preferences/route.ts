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
  if (typeof body.emailNotificationsEnabled !== "boolean") {
    return apiError("emailNotificationsEnabled must be a boolean", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailNotificationsEnabled: body.emailNotificationsEnabled },
  });

  return NextResponse.json({ emailNotificationsEnabled: body.emailNotificationsEnabled });
});
