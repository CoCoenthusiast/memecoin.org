import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(
  request: NextRequest
) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");

  if (!token) {
    return apiError("missing-token", 400);
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
    select: { id: true, verificationTokenExpiresAt: true },
  });

  if (!user) {
    return apiError("invalid-token", 400);
  }

  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
    return apiError("expired-token", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ verified: true });
});