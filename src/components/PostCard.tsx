import Link from "next/link"

type PostCardProps = {
  post: {
    id: string
    title: string
    body: string
    createdAt: string
    author: { id: string; username: string }
    channel?: { slug: string; name: string }
    _count: { replies: number; reactions: number }
  }
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function PostCard({ post }: PostCardProps) {
  const preview = post.body.length > 150 ? post.body.slice(0, 150) + "..." : post.body

  return (
    <Link href={`/p/${post.id}`} className="block group">
      <div className="bg-[#111827]/80 border border-gray-800 rounded-2xl shadow-lg shadow-black/20 p-5 transition-all duration-200 hover:border-green-500/40 hover:shadow-green-500/10 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold tracking-tight truncate transition-colors group-hover:text-green-400">{post.title}</h3>
            {post.channel && (
              <span className="inline-block mt-1 text-xs font-medium text-indigo-400">
                /c/{post.channel.slug}
              </span>
            )}
          </div>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">
            HOT
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{preview}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span>
            by{" "}
            <Link
              href={`/u/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {post.author.username}
            </Link>
          </span>
          <span>{timeAgo(post.createdAt)}</span>
          <span className="text-green-400 font-medium">{post._count.replies} replies</span>
          <span>{post._count.reactions} reactions</span>
        </div>
      </div>
    </Link>
  )
}
