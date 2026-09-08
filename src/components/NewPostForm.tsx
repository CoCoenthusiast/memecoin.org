"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CHANNELS } from "@/lib/constants"
import { AuthGuard } from "@/components/AuthGuard"
import { MentionTextarea } from "@/components/MentionTextarea"
import { useSession } from "@/hooks/useSession"
import { parseApiError } from "@/lib/api"

export function NewPostForm({ channelSlug }: { channelSlug?: string }) {
  const { user, refresh } = useSession()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(channelSlug || "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sending, setSending] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const activeSlug = channelSlug || selectedChannel
  const isPnlFlex = activeSlug === "pnl-flex"

  async function handleResendVerification() {
    setResending(true)
    setResendMsg(null)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResendMsg({ ok: true, text: "Verification email sent. Check your inbox (and spam)." })
      } else {
        setResendMsg({ ok: false, text: data.error || "Failed to send. Please try again." })
        if (res.status === 400 && String(data.error).includes("already verified")) refresh()
      }
    } catch {
      setResendMsg({ ok: false, text: "Failed to send. Please try again." })
    } finally {
      setResending(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      const form = new FormData()
      form.append("image", file)

      const res = await fetch("/api/upload/post-image", { method: "POST", body: form })
      if (!res.ok) {
        setError(await parseApiError(res))
        return
      }

      const data = await res.json()
      setImageUrl(data.imageUrl)
      setVideoUrl(null)
      if (videoRef.current) videoRef.current.value = ""
    } catch {
      setError("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      const form = new FormData()
      form.append("video", file)

      const res = await fetch("/api/upload/post-video", { method: "POST", body: form })
      if (!res.ok) {
        setError(await parseApiError(res))
        return
      }

      const data = await res.json()
      setVideoUrl(data.videoUrl)
      setImageUrl(null)
      if (imageRef.current) imageRef.current.value = ""
    } catch {
      setError("Failed to upload video")
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setImageUrl(null)
    if (imageRef.current) imageRef.current.value = ""
  }

  function removeVideo() {
    setVideoUrl(null)
    if (videoRef.current) videoRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const slug = channelSlug || selectedChannel
    if (!slug) {
      setError("Please select a channel")
      return
    }

    if (!body.trim() || body.trim().length < 10) {
      setError("Please write a message of at least 10 characters")
      return
    }

    setSubmitting(true)
    setSending(true)

    try {
      const res = await fetch(`/api/channels/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        }),
      })

      if (!res.ok) {
        setError(await parseApiError(res))
        setSubmitting(false)
        setSending(false)
        return
      }

      router.push(`/c/${slug}`)
    } catch {
      setError("Something went wrong")
      setSubmitting(false)
      setSending(false)
    }
  }

  return (
    <AuthGuard>
      {user && !user.emailVerified && (
        <div className="mb-5 p-4 bg-amber-900/20 border border-amber-800/70 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="text-sm">
            <p className="font-medium text-amber-200">Please verify your email before posting.</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Check your inbox (and spam) for the verification link.</p>
            {resendMsg && (
              <p className={`text-xs mt-1.5 ${resendMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {resendMsg.text}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="shrink-0 px-4 py-2 rounded-xl bg-transparent border border-amber-600 text-amber-300 font-medium text-sm transition-all duration-200 hover:bg-amber-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}
      {sending && (
        <div className="mb-5 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl opacity-60">
          <p className="text-sm text-gray-400">Posting &quot;{title}&quot;...</p>
          <span className="text-xs text-gray-500 mt-1 inline-block">sending...</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
            placeholder="Post title"
          />
        </div>

        {!channelSlug && (
          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-300 mb-1">
              Channel
            </label>
            <select
              id="channel"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
            >
              <option value="">Select a channel</option>
              {CHANNELS.map((channel) => (
                <option key={channel.slug} value={channel.slug}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">
            Body
          </label>
          <MentionTextarea
            id="body"
            value={body}
            onChange={setBody}
            rows={10}
            maxLength={10000}
            placeholder="Write your post..."
          />
        </div>

        {isPnlFlex && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Image (optional)
            </label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-h-48 rounded-xl border border-gray-800"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-gray-900/80 text-gray-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  x
                </button>
              </div>
            ) : (
              <input
                ref={imageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploading || !!videoUrl}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-neon-glow file:bg-transparent file:text-neon-glow hover:file:bg-neon-glow/10 file:cursor-pointer disabled:opacity-50"
              />
            )}
          </div>
        )}

        {isPnlFlex && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video (optional, PnL Flex only)
            </label>
            {videoUrl ? (
              <div className="relative inline-block">
                <video
                  src={videoUrl}
                  controls
                  className="max-h-48 rounded-xl border border-gray-800"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-gray-900/80 text-gray-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  x
                </button>
              </div>
            ) : (
              <input
                ref={videoRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploading || !!imageUrl}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-neon-glow file:bg-transparent file:text-neon-glow hover:file:bg-neon-glow/10 file:cursor-pointer disabled:opacity-50"
              />
            )}
          </div>
        )}

        {uploading && <p className="text-xs text-gray-500">Uploading...</p>}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full px-4 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Create Post"}
        </button>
      </form>
    </AuthGuard>
  )
}
