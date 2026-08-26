"use client"
import { useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"

export function NewReplyForm({ postId, onSuccess }: { postId: string; onSuccess?: () => void }) {
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
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            maxLength={10000}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
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
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Reply"}
        </button>
      </form>
    </AuthGuard>
  )
}
