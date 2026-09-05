import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user)) return apiError("Forbidden", 403);
  return null;
}

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await getBody<{ userId: string }>(request);
  if (!body.userId) return apiError("userId is required", 400);

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true, tokenVersion: true },
  });
  if (!user) return apiError("User not found", 404);

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data: { tokenVersion: user.tokenVersion + 1 },
    select: { id: true, tokenVersion: true },
  });

  return NextResponse.json({ ok: true, tokenVersion: updated.tokenVersion });
});
