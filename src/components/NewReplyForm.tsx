"use client"
import { useState, useRef } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { FormatToolbar } from "@/components/FormatToolbar"

export function NewReplyForm({ postId, onSuccess }: { postId: string; onSuccess?: () => void }) {
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [optimistic, setOptimistic] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const text = body.trim()
    setOptimistic(text)
    setBody("")

    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to post reply")
        setBody(text)
        setOptimistic(null)
        return
      }

      setOptimistic(null)
      onSuccess?.()
    } catch {
      setError("Something went wrong")
      setBody(text)
      setOptimistic(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      {optimistic && (
        <div className="mb-3 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl opacity-60">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{optimistic}</p>
          <span className="text-xs text-gray-500 mt-1 inline-block">sending...</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <FormatToolbar value={body} onChange={setBody} textareaRef={bodyRef} />
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            maxLength={10000}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent resize-y"
            placeholder="Write a reply..."
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-transparent border border-neon-glow text-neon-glow text-sm font-medium transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Reply"}
        </button>
      </form>
    </AuthGuard>
  )
}
