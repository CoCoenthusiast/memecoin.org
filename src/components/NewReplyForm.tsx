"use client"
import { useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { MentionTextarea } from "@/components/MentionTextarea"
import { parseApiError } from "@/lib/api"

type NewReplyFormProps = {
  postId: string
  parentReplyId?: string
  replyingTo?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewReplyForm({ postId, parentReplyId, replyingTo, onSuccess, onCancel }: NewReplyFormProps) {
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [optimistic, setOptimistic] = useState<string | null>(null)

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
        body: JSON.stringify({
          body: text,
          parentId: parentReplyId || undefined,
        }),
      })

      if (!res.ok) {
        setError(await parseApiError(res))
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
      {replyingTo && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
          <span>
            Replying to <span className="text-neon">@{replyingTo}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-white transition-colors underline"
            >
              cancel
            </button>
          )}
        </div>
      )}
      {optimistic && (
        <div className="mb-3 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl opacity-60">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{optimistic}</p>
          <span className="text-xs text-gray-500 mt-1 inline-block">sending...</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <MentionTextarea
          value={body}
          onChange={setBody}
          rows={3}
          maxLength={10000}
          placeholder={replyingTo ? `Reply to @${replyingTo}...` : "Write a reply..."}
        />

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
