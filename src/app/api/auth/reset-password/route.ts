import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const body = await getBody<{ token: string; password: string }>(request);

  if (!body.token || typeof body.token !== "string") {
    return apiError("Token is required");
  }

  if (!body.password || typeof body.password !== "string") {
    return apiError("Password is required");
  }

  // Same validation as registration
  if (
    body.password.length < 8 ||
    !/[A-Z]/.test(body.password) ||
    !/[0-9]/.test(body.password)
  ) {
    return apiError(
      "Password must be at least 8 characters and include at least one uppercase letter and one number"
    );
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: body.token },
    select: { id: true, resetTokenExpiresAt: true },
  });

  if (!user) {
    return apiError("Invalid or expired reset token", 400);
  }

  if (
    user.resetTokenExpiresAt &&
    user.resetTokenExpiresAt < new Date()
  ) {
    return apiError("Invalid or expired reset token", 400);
  }

  const hashedPassword = await hashPassword(body.password);

  // Update password, clear reset token, and invalidate all existing sessions
  // by incrementing tokenVersion (same mechanism as Force Logout).
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
      tokenVersion: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true });
});
