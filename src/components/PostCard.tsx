"use client"
import { useState } from "react"
import Link from "next/link"
import { ContentActions } from "@/components/ContentActions"
import { useSession } from "@/hooks/useSession"
import { StyledUsername } from "@/components/StyledUsername"
import { isUserVip } from "@/lib/vip"

type PostCardProps = {
  post: {
    id: string
    title: string
    body: string
    createdAt: string
    viewCount?: number
    pinned?: boolean
    author: {
      id: string
      username: string
      avatarUrl?: string | null
      nameStyle?: string | null
      isVip?: boolean
      vipExpiresAt?: string | null
    }
    channel?: { slug: string; name: string }
    _count: { replies: number; reactions: number }
  }
  onContentAction?: () => void
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

export default function PostCard({ post, onContentAction }: PostCardProps) {
  const { user } = useSession()
  const [pinning, setPinning] = useState(false)
  const isUserAdmin = user?.role === "ADMIN"
  const preview = post.body.length > 150 ? post.body.slice(0, 150) + "..." : post.body
  const isHot =
    Date.now() - new Date(post.createdAt).getTime() <= 10 * 60 * 1000 ||
    post._count.replies >= 3 ||
    post._count.reactions >= 5 ||
    (post.viewCount ?? 0) >= 20

  async function handleTogglePin() {
    setPinning(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/pin`, { method: "POST" })
      if (res.ok) onContentAction?.()
    } finally {
      setPinning(false)
    }
  }

  return (
    <div className="relative block group transition-transform duration-200 hover:-translate-y-0.5">
      <Link href={`/p/${post.id}`} className="absolute inset-0 z-0" aria-label={post.title} />
      <div className="bg-[#111827]/80 border border-gray-800 rounded-2xl shadow-lg shadow-black/20 p-5 transition-all duration-200 group-hover:border-neon-glow/40 group-hover:shadow-neon-glow/10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-white font-bold tracking-tight truncate transition-colors group-hover:text-neon">
              {post.title}
              {post.pinned && (
                <svg
                  className="w-4 h-4 text-neon flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Pinned"
                >
                  <path d="M16 3h-8v2h1v4L7 11v2h4v6l1 2 1-2v-6h4v-2l-2-2V5h1V3z" />
                </svg>
              )}
            </h3>
            {post.channel && (
              <span className="inline-block mt-1 text-xs font-medium text-indigo-400">
                /c/{post.channel.slug}
              </span>
            )}
          </div>
          {isHot && (
            <span className="rounded-full bg-neon-glow/10 px-2 py-0.5 text-xs font-semibold text-neon">
              HOT
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{preview}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            {post.author.avatarUrl && (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="relative z-10 w-10 h-10 rounded-lg object-cover border border-gray-700"
              />
            )}
            by{" "}
            <Link
              href={`/profile/${post.author.username}`}
              className="relative z-10 text-gray-300 hover:text-white transition-colors"
            >
              <StyledUsername
                username={post.author.username}
                nameStyle={post.author.nameStyle}
                isVip={isUserVip(post.author)}
              />
            </Link>
          </span>
          <span>{timeAgo(post.createdAt)}</span>
          <span className="text-neon font-medium">{post._count.replies} replies</span>
          <span>{post._count.reactions} reactions</span>
          {isUserAdmin && (
            <button
              onClick={handleTogglePin}
              disabled={pinning}
              className="relative z-10 px-2 py-1 rounded-md text-xs font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
              title={post.pinned ? "Unpin" : "Pin"}
            >
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          <div className="relative z-10 ml-auto">
            <ContentActions targetId={post.id} targetType="post" authorId={post.author.id} createdAt={post.createdAt} onSuccess={onContentAction} />
          </div>
        </div>
      </div>
    </div>
  )
}
