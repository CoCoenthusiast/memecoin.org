import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, isOwner } from "@/lib/auth";
import { apiError, getBody, withErrorHandling } from "@/lib/api";

async function requireOwner() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user) || !isOwner(session.user)) return apiError("Forbidden", 403);
  return null;
}

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  const denied = await requireOwner();
  if (denied) return denied;

  const body = await getBody<{ title: string; content: string; imageUrl?: string }>(request);

  if (!body.title || body.title.trim().length < 1 || body.title.length > 200) {
    return apiError("Title must be between 1 and 200 characters");
  }

  if (!body.content || body.content.trim().length < 10 || body.content.length > 10000) {
    return apiError("Content must be between 10 and 10000 characters");
  }

  const recap = await prisma.dailyRecap.create({
    data: {
      title: body.title.trim(),
      content: body.content.trim(),
      imageUrl: body.imageUrl || null,
    },
  });

  return NextResponse.json(recap, { status: 201 });
});
