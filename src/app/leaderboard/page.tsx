import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      posts: { select: { _count: { select: { reactions: true } } } },
    },
  });

  const rows = users
    .map((u) => {
      const totalReactions = u.posts.reduce((sum, p) => sum + p._count.reactions, 0);
      const totalPosts = u.posts.length;
      const reactionsPerPost = totalPosts === 0 ? 0 : totalReactions / totalPosts;
      return {
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        totalReactions,
        totalPosts,
        reactionsPerPost,
      };
    })
    .filter((r) => r.totalReactions > 0)
    .sort((a, b) => b.totalReactions - a.totalReactions);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
        <p className="text-gray-400">Top degens by reactions received on their posts</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No reactions yet. Be the first to get one!</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-8 text-center text-lg font-bold text-gray-500">{index + 1}</div>
              <div className="flex-shrink-0">
                {row.avatarUrl ? (
                  <img
                    src={row.avatarUrl}
                    alt={row.username}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <Link
                href={`/profile/${row.username}`}
                className="min-w-0 flex-1 font-semibold text-gray-100 hover:text-neon transition-colors"
              >
                {row.username}
              </Link>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-lg font-bold text-neon">{row.totalReactions}</div>
                  <div className="text-xs text-gray-500">reactions</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-100">{row.totalPosts}</div>
                  <div className="text-xs text-gray-500">posts</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neon">
                    {row.reactionsPerPost.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">reactions/post</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
