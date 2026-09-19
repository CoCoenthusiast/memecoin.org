import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";
import { vipChannelFilter } from "@/lib/vipChannel";

export const GET = withErrorHandling(async function GET() {
  const vipFilter = await vipChannelFilter();

  const [activePosts, postCount, memberCount] = await Promise.all([
    prisma.post.findMany({
      where: vipFilter,
      orderBy: { lastActivityAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true,
        channel: { select: { slug: true, name: true } },
        author: { select: { username: true } },
      },
    }),
    prisma.post.count({ where: vipFilter }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ activePosts, postCount, memberCount });
});
