import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { apiError, getBody } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await getBody<{ email: string; password: string }>(request);

  if (!body.email || !body.password) {
    return apiError("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, username: true, email: true, password: true },
  });

  if (!user) {
    return apiError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(body.password, user.password);
  if (!valid) {
    return apiError("Invalid email or password", 401);
  }

  const token = signToken({ userId: user.id });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } });
}
