"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import PostCard from "@/components/PostCard"
import { ContentActions } from "@/components/ContentActions"
import { useSession } from "@/hooks/useSession"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
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

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser, loading: sessionLoading } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [commentBody, setCommentBody] = useState("")
  const [commentError, setCommentError] = useState("")
  const [posting, setPosting] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<"posts" | "mural">("posts")

  const isOwner = !!currentUser && currentUser.username === username

  const loadProfile = useCallback(async () => {
    try {
      const [prof, coms] = await Promise.all([
        fetch(`/api/users/${username}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/users/${username}/comments`).then((r) => (r.ok ? r.json() : [])),
      ])
      setProfile(prof)
      setComments(coms || [])
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    setCommentError("")
    setPosting(true)
    try {
      const res = await fetch(`/api/users/${username}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      })
      if (res.ok) {
        setCommentBody("")
        const data = await fetch(`/api/users/${username}/comments`).then((r) => r.json())
        setComments(data)
      } else {
        const data = await res.json()
        setCommentError(data.error || "Failed to post comment")
      }
    } catch {
      setCommentError("Something went wrong")
    }
    setPosting(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError("")
    const form = new FormData()
    form.append("avatar", file)
    try {
      const res = await fetch(`/api/users/${username}/avatar`, {
        method: "POST",
        body: form,
      })
      if (res.ok) {
        const data = await res.json()
        setProfile((p: any) => ({ ...p, avatarUrl: data.avatarUrl }))
      } else {
        const data = await res.json()
        setUploadError(data.error || "Upload failed")
      }
    } catch {
      setUploadError("Upload failed")
    }
    e.target.value = ""
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!profile) return <div className="text-center text-gray-500 py-12">User not found</div>

  return (
    <div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-20 h-20 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-100">{profile.username}</h1>
              <ContentActions targetId={profile.id} targetType="user" onSuccess={loadProfile} />
            </div>
            <p className="text-gray-400 text-sm mt-1">Member since {formatDate(profile.createdAt)}</p>

            <div className="flex gap-6 mt-4">
              <div>
                <div className="text-xl font-bold text-gray-100">{profile.postCount}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-100">{profile.replyCount}</div>
                <div className="text-xs text-gray-500">Replies</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">{profile.totalReactions}</div>
                <div className="text-xs text-gray-500">Reactions received</div>
              </div>
            </div>

            {isOwner && (
              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] text-sm font-medium hover:bg-green-500/10 transition-colors"
                >
                  Trocar foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {uploadError && (
                  <p className="mt-2 text-sm text-red-400">{uploadError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "posts"
              ? "text-[#4ade80] border-[#4ade80]"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          Posts ({profile.postCount})
        </button>
        <button
          onClick={() => setActiveTab("mural")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "mural"
              ? "text-[#4ade80] border-[#4ade80]"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          Mural ({comments.length})
        </button>
      </div>

      {activeTab === "posts" ? (
        <div className="space-y-4">
          {profile.posts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts yet</p>
          ) : (
            profile.posts.map((post: any) => <PostCard key={post.id} post={post} onContentAction={loadProfile} />)
          )}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {sessionLoading ? (
            <div className="text-sm text-gray-500 py-2">Loading...</div>
          ) : currentUser ? (
            <form onSubmit={handleAddComment} className="mb-4 space-y-2">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                required
                rows={2}
                maxLength={1000}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                placeholder="Leave a comment on this profile..."
              />
              {commentError && <p className="text-sm text-red-400">{commentError}</p>}
              <button
                type="submit"
                disabled={posting}
                className="px-4 py-2 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] text-sm font-medium hover:bg-green-500/10 transition-colors disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post comment"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Log in to leave a comment on this profile.
            </p>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.body}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-gray-300 font-medium">{comment.author.username}</span>
                    <span>{timeAgo(comment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
