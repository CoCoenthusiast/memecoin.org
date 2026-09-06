import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth";
import { apiError, withErrorHandling } from "@/lib/api";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  if (!isAdmin(session.user)) return apiError("Forbidden", 403);
  return null;
}

export const GET = withErrorHandling(async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    activeUsers7d,
    activeUsers30d,
    newPostsByDay,
    totalUsers,
    totalVipUsers,
    totalPosts,
    totalReplies,
    totalReactions,
  ] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      WHERE EXISTS (
        SELECT 1 FROM "Post" p WHERE p."authorId" = u.id AND p."createdAt" >= ${sevenDaysAgo}
      ) OR EXISTS (
        SELECT 1 FROM "Reply" r WHERE r."authorId" = u.id AND r."createdAt" >= ${sevenDaysAgo}
      ) OR EXISTS (
        SELECT 1 FROM "Reaction" rc WHERE rc."userId" = u.id AND rc."createdAt" >= ${sevenDaysAgo}
      )
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      WHERE EXISTS (
        SELECT 1 FROM "Post" p WHERE p."authorId" = u.id AND p."createdAt" >= ${thirtyDaysAgo}
      ) OR EXISTS (
        SELECT 1 FROM "Reply" r WHERE r."authorId" = u.id AND r."createdAt" >= ${thirtyDaysAgo}
      ) OR EXISTS (
        SELECT 1 FROM "Reaction" rc WHERE rc."userId" = u.id AND rc."createdAt" >= ${thirtyDaysAgo}
      )
    `,
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Post"
      WHERE "createdAt" >= ${fourteenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `,
    prisma.user.count(),
    prisma.user.count({ where: { isVip: true } }),
    prisma.post.count(),
    prisma.reply.count(),
    prisma.reaction.count(),
  ]);

  const postsPerDay = newPostsByDay.map((row) => ({
    date: row.date,
    count: Number(row.count),
  }));

  return NextResponse.json({
    activeUsers7d: Number(activeUsers7d[0].count),
    activeUsers30d: Number(activeUsers30d[0].count),
    newPostsPerDay: postsPerDay,
    users: {
      total: Number(totalUsers),
      vip: Number(totalVipUsers),
    },
    totals: {
      posts: Number(totalPosts),
      replies: Number(totalReplies),
      reactions: Number(totalReactions),
    },
  });
});
