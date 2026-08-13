"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CHANNELS } from "@/lib/constants"
import { AuthGuard } from "@/components/AuthGuard"

export function NewPostForm({ channelSlug }: { channelSlug?: string }) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(channelSlug || "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const slug = channelSlug || selectedChannel
    if (!slug) {
      setError("Please select a channel")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/channels/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create post")
        setSubmitting(false)
        return
      }

      router.push(`/c/${slug}`)
      router.refresh()
    } catch {
      setError("Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
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
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={10000}
            required
            rows={10}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            placeholder="Write your post..."
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
          className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Create Post"}
        </button>
      </form>
    </AuthGuard>
  )
}
