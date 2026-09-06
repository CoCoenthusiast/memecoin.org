"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import PostCard from "@/components/PostCard"
import { ContentActions } from "@/components/ContentActions"
import { FormatToolbar } from "@/components/FormatToolbar"
import { useSession } from "@/hooks/useSession"
import { isUserVip } from "@/lib/vip"
import { StyledName, nameStyleFromJson, type NameStyle } from "@/components/StyledName"
import { StyledUsername } from "@/components/StyledUsername"
import { parseApiError } from "@/lib/api"

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
  const [bannerError, setBannerError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<"posts" | "mural">("posts")
  const [nameStyle, setNameStyle] = useState<NameStyle>({
    colors: ["#39ff14", "#00ffff"],
    animation: "static",
    speed: "medium",
    glow: false,
  })
  const [savingStyle, setSavingStyle] = useState(false)
  const [styleSaved, setStyleSaved] = useState("")
  const [styleError, setStyleError] = useState("")
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentBody, setEditCommentBody] = useState("")
  const [savingComment, setSavingComment] = useState(false)
  const [editCommentError, setEditCommentError] = useState("")
  const editCommentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const isOwner = !!currentUser && currentUser.username === username
  const canGif = isOwner && !!currentUser && isUserVip(currentUser)
  const canBanner = isOwner && !!currentUser && isUserVip(currentUser)

  const loadProfile = useCallback(async () => {
    try {
      const [prof, coms] = await Promise.all([
        fetch(`/api/users/${username}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/users/${username}/comments`).then((r) => (r.ok ? r.json() : [])),
      ])
      setProfile(prof)
      setComments(coms || [])
      const saved = nameStyleFromJson(prof?.nameStyle)
      if (saved) {
        setNameStyle({ ...saved, speed: saved.speed || "medium" })
      } else {
        setStyleSaved("")
      }
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
        setCommentError(await parseApiError(res))
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
        setUploadError(await parseApiError(res))
      }
    } catch {
      setUploadError("Upload failed")
    }
    e.target.value = ""
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError("")
    setBannerError("")
    const form = new FormData()
    form.append("banner", file)
    try {
      const res = await fetch(`/api/users/${username}/banner`, {
        method: "POST",
        body: form,
      })
      if (res.ok) {
        const data = await res.json()
        setProfile((p: any) => ({ ...p, bannerUrl: data.bannerUrl }))
      } else {
        setBannerError(await parseApiError(res))
      }
    } catch {
      setBannerError("Upload failed")
    }
    e.target.value = ""
  }

  async function handleSaveStyle() {
    setSavingStyle(true)
    setStyleSaved("")
    setStyleError("")
    const payload = JSON.stringify(nameStyle)
    try {
      const res = await fetch(`/api/users/${username}/style`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameStyle: payload }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile((p: any) => ({ ...p, nameStyle: data.nameStyle }))
        setStyleSaved("Name style saved")
        setShowStylePanel(false)
      } else {
        setStyleError(await parseApiError(res))
      }
    } catch {
      setStyleError("Something went wrong")
    }
    setSavingStyle(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!profile) return <div className="text-center text-gray-500 py-12">User not found</div>

  return (
    <div>
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
        {profile.bannerUrl && (
          <>
            <img
              src={profile.bannerUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gray-950/25" />
          </>
        )}
        <div
          className={`relative flex items-start gap-6 min-h-[300px] ${
            profile.bannerUrl ? "p-8 pt-6" : "p-8"
          }`}
        >
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-44 h-44 rounded-xl object-cover border border-gray-700"
              />
            ) : (
              <div className="w-44 h-44 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                <StyledUsername
                  username={profile.username}
                  nameStyle={profile.nameStyle}
                  isVip={isUserVip(profile)}
                />
              </h1>
              <ContentActions targetId={profile.id} targetType="user" onSuccess={loadProfile} />
            </div>
            <p className="text-gray-300 text-sm mt-1">Member since {formatDate(profile.createdAt)}</p>

            <div className="flex gap-6 mt-4">
              <div>
                <div className="text-xl font-bold text-gray-100">{profile.postCount}</div>
                <div className="text-xs text-gray-300">Posts</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-100">{profile.replyCount}</div>
                <div className="text-xs text-gray-300">Replies</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neon">{profile.totalReactions}</div>
                <div className="text-xs text-gray-300">Reactions received</div>
              </div>
            </div>

            {isOwner && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors"
                  >
                    Change photo
                  </button>
                  {canBanner && (
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors"
                    >
                      Change banner
                    </button>
                  )}
                  {canBanner && (
                    <button
                      onClick={() => setShowStylePanel((v) => !v)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        showStylePanel
                          ? "bg-neon-glow/15 border border-neon-glow text-neon"
                          : "bg-transparent border border-neon-glow text-neon-glow hover:bg-neon-glow/10"
                      }`}
                    >
                      Customize name
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    canGif
                      ? "image/jpeg,image/png,image/webp,image/gif"
                      : "image/jpeg,image/png,image/webp"
                  }
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept={
                    canGif
                      ? "image/jpeg,image/png,image/webp,image/gif"
                      : "image/jpeg,image/png,image/webp"
                  }
                  onChange={handleBannerChange}
                  className="hidden"
                />
                {canGif && (
                  <p className="mt-2 text-xs text-neon">GIF supported</p>
                )}
                {uploadError && (
                  <p className="mt-2 text-sm text-red-400">{uploadError}</p>
                )}
                {bannerError && (
                  <p className="mt-2 text-sm text-red-400">{bannerError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {canBanner && showStylePanel && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Customize your name</h2>

          <div className="border border-gray-800 rounded-xl bg-gray-950/60 p-4 mb-5 flex items-center justify-center">
            <StyledName text={profile.username} style={nameStyle} className="text-3xl font-bold" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Colors (gradient)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="color"
                    value={nameStyle.colors[0]}
                    onChange={(e) =>
                      setNameStyle((s) => ({ ...s, colors: [e.target.value, s.colors[1]] }))
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-gray-700 bg-gray-900"
                  />
                  C1
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="color"
                    value={nameStyle.colors[1]}
                    onChange={(e) =>
                      setNameStyle((s) => ({ ...s, colors: [s.colors[0], e.target.value] }))
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-gray-700 bg-gray-900"
                  />
                  C2
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Animation</label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["static", "Static"],
                    ["shift", "Shift"],
                    ["pulse", "Pulse"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNameStyle((s) => ({ ...s, animation: value }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      nameStyle.animation === value
                        ? "bg-neon-glow/15 border-neon-glow text-neon"
                        : "border-gray-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={nameStyle.glow}
                onChange={(e) => setNameStyle((s) => ({ ...s, glow: e.target.checked }))}
                className="w-4 h-4 accent-neon"
              />
              <span className="text-sm text-gray-300">Glow (neon shadow)</span>
            </label>
            <div className="flex items-center gap-3">
              {styleSaved && <span className="text-sm text-neon">{styleSaved}</span>}
              {styleError && <span className="text-sm text-red-400">{styleError}</span>}
              <button
                onClick={handleSaveStyle}
                disabled={savingStyle}
                className="px-4 py-2 rounded-lg bg-neon-glow text-gray-950 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingStyle ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "posts"
              ? "text-neon border-neon"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          Posts ({profile.postCount})
        </button>
        <button
          onClick={() => setActiveTab("mural")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "mural"
              ? "text-neon border-neon"
              : "text-gray-500 border-transparent hover:text-gray-300"
          }`}
        >
          Wall ({comments.length})
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
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent resize-y"
                placeholder="Leave a comment on this profile..."
              />
              {commentError && <p className="text-sm text-red-400">{commentError}</p>}
              <button
                type="submit"
                disabled={posting}
                className="px-4 py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors disabled:opacity-50"
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
              {comments.map((comment) => {
                const isEditing = editingCommentId === comment.id
                return (
                  <div key={comment.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                    {isEditing ? (
                      <div>
                        <FormatToolbar value={editCommentBody} onChange={setEditCommentBody} textareaRef={editCommentTextareaRef} />
                        <textarea
                          ref={editCommentTextareaRef}
                          value={editCommentBody}
                          onChange={(e) => setEditCommentBody(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent resize-y"
                          placeholder="Write a comment..."
                        />
                        {editCommentError && (
                          <p className="mt-2 text-sm text-red-400">{editCommentError}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={async () => {
                              setSavingComment(true)
                              setEditCommentError("")
                              try {
                                const res = await fetch(`/api/profile-comments/${comment.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ body: editCommentBody }),
                                })
                                if (res.ok) {
                                  setEditingCommentId(null)
                                  setComments((prev) => prev.map((c) =>
                                    c.id === comment.id ? { ...c, body: editCommentBody, editedAt: new Date().toISOString() } : c
                                  ))
                                } else {
                                  setEditCommentError(await parseApiError(res))
                                }
                              } catch {
                                setEditCommentError("Something went wrong")
                              } finally {
                                setSavingComment(false)
                              }
                            }}
                            disabled={savingComment || !editCommentBody.trim()}
                            className="px-3 py-1.5 rounded-lg bg-neon-glow text-gray-950 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {savingComment ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditCommentBody("")
                              setEditCommentError("")
                            }}
                            disabled={savingComment}
                            className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-sm font-medium hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.body}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">
                        <StyledUsername
                          username={comment.author.username}
                          nameStyle={comment.author.nameStyle}
                          isVip={isUserVip(comment.author)}
                        />
                      </span>
                      <span>{timeAgo(comment.createdAt)}{comment.editedAt && <span className="text-gray-600"> (edited)</span>}</span>
                      <div className="ml-auto">
                        <ContentActions
                          targetId={comment.id}
                          targetType="comment"
                          authorId={comment.author.id}
                          createdAt={comment.createdAt}
                          onSuccess={() => setComments((prev) => prev.filter((c) => c.id !== comment.id))}
                          onEdit={() => {
                            setEditingCommentId(comment.id)
                            setEditCommentBody(comment.body)
                            setEditCommentError("")
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
