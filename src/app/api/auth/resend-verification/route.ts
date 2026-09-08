import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/email";

export const POST = withErrorHandling(async function POST() {
  const { user } = await requireAuth();

  if (user.emailVerified) {
    return apiError("Your email is already verified", 400);
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiresAt },
  });

  // Intentional: fire-and-forget. Se o envio falhar o usuário pode
  // tentar novamente — o link anterior continua válido até expirar.
  sendVerificationEmail(user.email, verificationToken).catch((e) => {
    console.error("Failed to resend verification email", e);
  });

  return NextResponse.json({ ok: true });
});