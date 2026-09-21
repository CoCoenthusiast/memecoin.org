import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError, getBody, getClientIp, withErrorHandling } from "@/lib/api";
import {
  isRegistrationBlocked,
  recordRegistration,
} from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const ip = getClientIp(request);

  const blocked = isRegistrationBlocked(ip);
  if (blocked.blocked) {
    return apiError(
      `Too many accounts created from this location. Please try again in ${blocked.retryAfterMin} minutes.`,
      429
    );
  }

  recordRegistration(ip);

  const body = await getBody<{ username: string; email: string; password: string }>(request);

  if (!body.username || !body.email || !body.password) {
    return apiError("All fields are required");
  }

  if (!/^[a-zA-Z0-9]{3,20}$/.test(body.username)) {
    return apiError("Username must be 3-20 alphanumeric characters");
  }

  if (body.email.length > 254) {
    return apiError("Email must be at most 254 characters");
  }

  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(body.email)) {
    return apiError("Invalid email format");
  }

  if (
    body.password.length < 8 ||
    !/[A-Z]/.test(body.password) ||
    !/[0-9]/.test(body.password)
  ) {
    return apiError(
      "Password must be at least 8 characters and include at least one uppercase letter and one number"
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ usernameLower: body.username.toLowerCase() }, { email: body.email }],
    },
  });

  if (existingUser) {
    return apiError("Username or email already in use", 409);
  }

  // Block registration if email belongs to a banned user or IP is banned
  const bannedEmailUser = await prisma.user.findFirst({
    where: { email: body.email, isBanned: true },
    select: { id: true },
  });
  if (bannedEmailUser) {
    return apiError("Unable to create account. Please contact support if you believe this is an error.", 403);
  }

  const bannedIpUser = await prisma.user.findFirst({
    where: { isBanned: true, bannedIps: { has: ip } },
    select: { id: true },
  });
  if (bannedIpUser) {
    return apiError("Unable to create account. Please contact support if you believe this is an error.", 403);
  }

  const hashedPassword = await hashPassword(body.password);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      username: body.username,
      usernameLower: body.username.toLowerCase(),
      email: body.email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt,
    },
    select: { id: true, email: true },
  });

  // Email verification is mandatory — user must verify before logging in.
  // If sending fails, the user can still request a resend from the verify-email page.
  let emailWarning: string | null = null;
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (e) {
    console.error("Failed to send verification email", e);
    emailWarning = "We couldn't send a verification email right now. Please request a new one from the verification page.";
  }

  return NextResponse.json(
    { message: "Account created. Please check your email to verify your account before logging in.", emailWarning },
    { status: 201 }
  );
});
