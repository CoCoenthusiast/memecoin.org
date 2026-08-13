import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, sessionCookieOptions } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST(
  request: NextRequest
) {
  const body = await getBody<{ username: string; email: string; password: string }>(request);

  if (!body.username || !body.email || !body.password) {
    return apiError("All fields are required");
  }

  if (!/^[a-zA-Z0-9]{3,20}$/.test(body.username)) {
    return apiError("Username must be 3-20 alphanumeric characters");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return apiError("Invalid email format");
  }

  if (body.password.length < 8) {
    return apiError("Password must be at least 8 characters");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: body.username }, { email: body.email }],
    },
  });

  if (existingUser) {
    if (existingUser.username === body.username) {
      return apiError("Username already taken", 409);
    }
    return apiError("Email already taken", 409);
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      password: hashedPassword,
    },
    select: { id: true, username: true, email: true, role: true },
  });

  const token = signToken({ userId: user.id, role: user.role });

  const cookieStore = await cookies();
  cookieStore.set(
    "token",
    token,
    sessionCookieOptions(60 * 60 * 24 * 7)
  );

  return NextResponse.json({ user }, { status: 201 });
});
