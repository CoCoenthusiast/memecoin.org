import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { apiError, getBody, getClientIp, withErrorHandling } from "@/lib/api";
import { sendPasswordResetEmail } from "@/lib/email";
import { isForgotPasswordBlocked, recordForgotPasswordAttempt } from "@/lib/rateLimit";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const body = await getBody<{ email: string }>(request);
  const ip = getClientIp(request);

  const blocked = isForgotPasswordBlocked(ip);
  if (blocked.blocked) {
    return apiError(
      `Too many password reset requests from this location. Please try again in ${blocked.retryAfterMin} minutes.`,
      429
    );
  }
  recordForgotPasswordAttempt(ip);

  if (!body.email || typeof body.email !== "string") {
    // Always return success to avoid email enumeration
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    select: { id: true, email: true },
  });

  console.log("[forgot-password] user encontrado:", !!user);

  if (user) {
    console.log("[forgot-password] Enviando email para:", user.email);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    // Intentional: fire-and-forget. Password reset email is secondary —
    // we always return success to the client regardless of email delivery.
    sendPasswordResetEmail(user.email, resetToken).catch((e) => {
      console.error("Failed to send password reset email", e);
    });
    console.log("[forgot-password] sendPasswordResetEmail chamado");
  }

  // Always return success — never reveal whether the email exists
  return NextResponse.json({ ok: true });
});
