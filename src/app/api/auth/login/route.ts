import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken, sessionCookieOptions } from "@/lib/auth";
import {
  apiError,
  getBody,
  getClientIp,
  withErrorHandling,
} from "@/lib/api";
import {
  isLoginBlocked,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/rateLimit";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const body = await getBody<{ email: string; password: string }>(request);

  if (!body.email || !body.password) {
    return apiError("Email and password are required");
  }

  const ip = getClientIp(request);

  const blocked = isLoginBlocked(body.email, ip);
  if (blocked.blocked) {
    return apiError(
      `Too many failed login attempts. Please try again in ${blocked.retryAfterMin} minutes.`,
      429
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, username: true, email: true, role: true, password: true, tokenVersion: true },
  });

  if (!user) {
    recordFailedLogin(body.email, ip);
    return apiError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(body.password, user.password);
  if (!valid) {
    recordFailedLogin(body.email, ip);
    return apiError("Invalid email or password", 401);
  }

  clearLoginAttempts(body.email, ip);

  const token = signToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });

  const cookieStore = await cookies();
  cookieStore.set(
    "token",
    token,
    sessionCookieOptions(60 * 60 * 24 * 7)
  );

  return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});
