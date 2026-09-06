"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ReactionBar } from "@/components/ReactionBar"
import { ReplyList } from "@/components/ReplyList"
import { NewReplyForm } from "@/components/NewReplyForm"
import { ContentActions } from "@/components/ContentActions"
import { FormatToolbar } from "@/components/FormatToolbar"
import { FormattedText } from "@/components/FormattedText"
import { useSession } from "@/hooks/useSession"
import { StyledUsername } from "@/components/StyledUsername"
import { isUserVip } from "@/lib/vip"
import { useMentionData, extractMentions } from "@/hooks/useMentionData"
import { parseApiError } from "@/lib/api"
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

type PostPageClientProps = {
  post: any
}

export default function PostPageClient({ post: initialPost }: PostPageClientProps) {
  const { user, loading: sessionLoading } = useSession()
  const router = useRouter()
  const [post, setPost] = useState(initialPost)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(initialPost.body)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionData = useMentionData(post ? extractMentions(post.body) : [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen])

  const loadPost = useCallback(async () => {
    const data = await fetch(`/api/posts/${post.id}`).then(r => r.ok ? r.json() : null)
    if (data) setPost(data)
  }, [post.id])

  useEffect(() => { loadPost() }, [loadPost])

  useEffect(() => {
    const interval = setInterval(() => loadPost(), 30000)
    return () => clearInterval(interval)
  }, [loadPost])

  const handlePostDeleted = useCallback(() => {
    if (post.channel?.slug) {
      router.push(`/c/${post.channel.slug}`)
    }
  }, [post.channel?.slug, router])

  async function handleSaveEdit() {
    setSaving(true)
    setEditError("")
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      })
      if (res.ok) {
        setEditing(false)
        loadPost()
      } else {
        setEditError(await parseApiError(res))
      }
    } catch {
      setEditError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditing(false)
    setEditBody(post.body)
    setEditError("")
  }

  if (!post) return <div className="text-center text-gray-500 py-12">Post not found</div>

  return (
    <div>
      {lightboxOpen && post.imageUrl && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
        >
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
      <article className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            {post.author.avatarUrl && (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="w-10 h-10 rounded-lg object-cover border border-gray-700"
              />
            )}
            <Link href={`/profile/${post.author.username}`} className="text-gray-300 hover:text-white transition-colors">
              <StyledUsername
                username={post.author.username}
                nameStyle={post.author.nameStyle}
                isVip={isUserVip(post.author)}
              />
            </Link>
          </span>
          <span>{timeAgo(post.createdAt)}{post.editedAt && <span className="text-gray-600"> (edited)</span>}</span>
          <span>{post._count?.replies ?? 0} replies</span>
        </div>
        {editing ? (
          <div className="mb-4">
            <FormatToolbar value={editBody} onChange={setEditBody} textareaRef={editTextareaRef} />
            <textarea
              ref={editTextareaRef}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={8}
              maxLength={10000}
              className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent resize-y"
              placeholder="Write your post..."
            />
            {editError && (
              <p className="mt-2 text-sm text-red-400">{editError}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editBody.trim()}
                className="px-3 py-1.5 rounded-lg bg-neon-glow text-gray-950 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-sm font-medium hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed mb-4">
            <FormattedText text={post.body} mentionData={mentionData} />
          </p>
        )}
        {post.imageUrl && (
          <div className="mb-4">
            <p className="text-[11px] text-gray-500 mb-1">Attachment</p>
            <img
              src={post.imageUrl}
              alt={post.title}
              onClick={() => setLightboxOpen(true)}
              className="max-h-[400px] max-w-lg w-auto object-contain rounded-xl border border-gray-800 bg-black/20 cursor-zoom-in"
            />
          </div>
        )}
        {post.videoUrl && (
          <div className="mb-4">
            <p className="text-[11px] text-gray-500 mb-1">Attachment</p>
            <video
              src={post.videoUrl}
              controls
              className="max-h-96 w-full object-cover rounded-xl border border-gray-800"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <ReactionBar
            targetId={post.id}
            type="post"
            reactions={post.reactions ?? []}
            currentUserId={user?.id}
            onSuccess={loadPost}
          />
          <ContentActions
            targetId={post.id}
            targetType="post"
            authorId={post.author.id}
            createdAt={post.createdAt}
            onSuccess={handlePostDeleted}
            onEdit={() => {
              setEditBody(post.body)
              setEditing(true)
            }}
          />
        </div>
      </article>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Replies</h2>
        <ReplyList replies={post.replies ?? []} currentUserId={user?.id} onSuccess={loadPost} />
      </div>

      {sessionLoading ? (
        <div className="text-sm text-gray-500 py-4">Loading...</div>
      ) : user ? (
        <NewReplyForm postId={post.id} onSuccess={loadPost} />
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
