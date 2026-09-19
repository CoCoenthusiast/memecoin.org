import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";
import { vipChannelFilter } from "@/lib/vipChannel";

export const GET = withErrorHandling(async function GET(
  request: NextRequest
) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const titlesOnly = searchParams.get("titlesOnly") === "true";
  const titlesAndFirstPostOnly = searchParams.get("titlesAndFirstPostOnly") === "true";
  const member = searchParams.get("member")?.trim();

  if (!q && !member) {
    return NextResponse.json([]);
  }

  const vipFilter = await vipChannelFilter();
  const where: {
    title?: object;
    OR?: object[];
    author?: { username?: { equals: string }; usernameLower?: { equals: string } };
    channelId?: { not: string };
  } = { ...vipFilter };

  if (titlesOnly) {
    where.title = { contains: q };
  } else if (titlesAndFirstPostOnly) {
    // "titles and first posts only": match the title or the original post
    // body, ignoring replies.
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
    ];
  } else {
    // Broad search (checkbox unchecked): also match the text of replies
    // belonging to a post.
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
      { replies: { some: { body: { contains: q } } } },
    ];
  }

  if (member) {
    where.author = { usernameLower: { equals: member.toLowerCase() } };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { lastActivityAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true } },
      channel: { select: { slug: true, name: true } },
      _count: { select: { replies: true, reactions: true } },
    },
  });

  return NextResponse.json(posts);
});
