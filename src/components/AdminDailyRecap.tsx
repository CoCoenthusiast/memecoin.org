"use client"
import { useRef, useState } from "react"
import { MentionTextarea } from "@/components/MentionTextarea"
import { parseApiError } from "@/lib/api"

export function AdminDailyRecap() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")
  const imageRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")
    setDone("")

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
    } catch {
      setError("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setImageUrl(null)
    if (imageRef.current) imageRef.current.value = ""
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setDone("")

    if (!title.trim()) {
      setError("Please add a title")
      return
    }
    if (!content.trim() || content.trim().length < 10) {
      setError("Please write a recap of at least 10 characters")
      return
    }

    setPublishing(true)
    try {
      const res = await fetch("/api/admin/daily-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl: imageUrl || undefined }),
      })

      if (!res.ok) {
        setError(await parseApiError(res))
        return
      }

      setDone("Recap published! It's now live on the home page.")
      setTitle("")
      setContent("")
      setImageUrl(null)
      if (imageRef.current) imageRef.current.value = ""
    } catch {
      setError("Something went wrong")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <form onSubmit={handlePublish} className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-200">Publish Daily Recap</h2>
        <span className="text-[11px] text-gray-500">Owner only</span>
      </div>

      <div>
        <label htmlFor="recap-title" className="block text-sm font-medium text-gray-300 mb-1">
          Title
        </label>
        <input
          id="recap-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
          placeholder="Daily recap title"
        />
      </div>

      <div>
        <label htmlFor="recap-content" className="block text-sm font-medium text-gray-300 mb-1">
          Content
        </label>
        <MentionTextarea
          id="recap-content"
          value={content}
          onChange={setContent}
          rows={8}
          maxLength={10000}
          placeholder="Write today's recap..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Image (optional)</label>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Preview" className="max-h-48 rounded-xl border border-gray-800" />
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
            disabled={uploading}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-neon-glow file:bg-transparent file:text-neon-glow hover:file:bg-neon-glow/10 file:cursor-pointer disabled:opacity-50"
          />
        )}
      </div>

      {uploading && <p className="text-xs text-gray-500">Uploading...</p>}

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {done && (
        <div className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-xl px-4 py-2">
          {done}
        </div>
      )}

      <button
        type="submit"
        disabled={publishing || uploading}
        className="px-6 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {publishing ? "Publishing..." : "Publish Recap"}
      </button>
    </form>
  )
}