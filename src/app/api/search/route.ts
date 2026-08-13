import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET(
  request: NextRequest
) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const titlesOnly = searchParams.get("titlesOnly") === "true";
  const member = searchParams.get("member")?.trim();

  if (!q) {
    return NextResponse.json([]);
  }

  const where: {
    title?: object;
    OR?: object[];
    author?: { username: { equals: string } };
  } = {};

  if (titlesOnly) {
    where.title = { contains: q };
  } else {
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
    ];
  }

  if (member) {
    where.author = { username: { equals: member } };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true } },
      channel: { select: { slug: true, name: true } },
      _count: { select: { replies: true, reactions: true } },
    },
  });

  return NextResponse.json(posts);
});
