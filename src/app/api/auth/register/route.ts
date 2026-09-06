import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, sessionCookieOptions } from "@/lib/auth";
import { apiError, getBody, getClientIp, withErrorHandling } from "@/lib/api";
import {
  isRegistrationBlocked,
  recordRegistration,
} from "@/lib/rateLimit";

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

  // SECURITY NOTE: The 409 status code combined with the generic message "Username or email
  // already in use" allows limited information disclosure - an attacker could theoretically
  // determine if a specific username OR email exists by observing the 409 vs 201 response.
  // However, we accept this residual risk because:
  // 1. The message is generic and doesn't reveal WHICH field is the duplicate
  // 2. Usernames are already public on the forum (visible on posts, replies, profiles)
  // 3. The 409 status is standard HTTP for "conflict" and doesn't reveal which field conflicts
  // 4. IP-based rate limiting (5/hour) already prevents brute-force enumeration
  // 5. Mitigations like "always return 200" or "always return 409" would break legitimate UX
  //    (users need to know if their username/email is taken to correct it)
  // 6. This is a public forum, not a sensitive system like banking or healthcare
  if (existingUser) {
    return apiError("Username or email already in use", 409);
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      username: body.username,
      usernameLower: body.username.toLowerCase(),
      email: body.email,
      password: hashedPassword,
    },
    select: { id: true, username: true, email: true, role: true, tokenVersion: true },
  });

  const token = signToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });

  const cookieStore = await cookies();
  cookieStore.set(
    "token",
    token,
    sessionCookieOptions(60 * 60 * 24 * 7)
  );

  return NextResponse.json({ user }, { status: 201 });
});
