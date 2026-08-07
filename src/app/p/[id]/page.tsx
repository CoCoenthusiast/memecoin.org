"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ReactionBar } from "@/components/ReactionBar"
import { ReplyList } from "@/components/ReplyList"
import { NewReplyForm } from "@/components/NewReplyForm"
import { useSession } from "@/hooks/useSession"

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

export default function PostPage() {
  const params = useParams()
  const id = params.id as string
  const { user, loading: sessionLoading } = useSession()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setPost(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!post) return <div className="text-center text-gray-500 py-12">Post not found</div>

  return (
    <div>
      <article className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          <Link href={`/profile/${post.author.username}`} className="text-gray-300 hover:text-white transition-colors">
            {post.author.username}
          </Link>
          <span>{timeAgo(post.createdAt)}</span>
          <span>{post._count?.replies ?? 0} replies</span>
        </div>
        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed mb-4">{post.body}</p>
        <ReactionBar
          targetId={post.id}
          type="post"
          reactions={post.reactions ?? []}
          currentUserId={user?.id}
        />
      </article>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Replies</h2>
        <ReplyList replies={post.replies ?? []} currentUserId={user?.id} />
      </div>

      {sessionLoading ? (
        <div className="text-sm text-gray-500 py-4">Loading...</div>
      ) : user ? (
        <NewReplyForm postId={post.id} />
      ) : (
        <p className="text-sm text-gray-500 py-4">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Log in
          </Link>{" "}
          to reply
        </p>
      )}
    </div>
  )
}
