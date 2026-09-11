import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/email";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const body = await getBody<{ email?: string }>(request);

  let userId: string | null = null;
  let userEmail: string | null = null;

  // Try authenticated user first
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, emailVerified: true },
    });
    if (user && !user.emailVerified) {
      userId = user.id;
      userEmail = user.email;
    }
  }

  // If not authenticated or already verified, try email from body
  if (!userId && body.email) {
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
      select: { id: true, email: true, emailVerified: true },
    });
    if (user && !user.emailVerified) {
      userId = user.id;
      userEmail = user.email;
    }
  }

  // Always return success to avoid email enumeration
  if (userId && userEmail) {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { verificationToken, verificationTokenExpiresAt },
    });

    // Intentional: fire-and-forget. Se o envio falhar o usuário pode
    // tentar novamente — o link anterior continua válido até expirar.
    sendVerificationEmail(userEmail, verificationToken).catch((e) => {
      console.error("Failed to resend verification email", e);
    });
  }

  return NextResponse.json({ ok: true });
});
