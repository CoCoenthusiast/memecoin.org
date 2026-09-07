"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/hooks/useSession"

type BookmarkButtonProps = {
  postId: string
  initialBookmarked?: boolean
  onChange?: (bookmarked: boolean) => void
}

export function BookmarkButton({ postId, initialBookmarked = false, onChange }: BookmarkButtonProps) {
  const { user } = useSession()
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [pending, setPending] = useState(false)

  if (!user) return null

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (pending) return
    setPending(true)

    const prev = bookmarked
    setBookmarked(!prev)

    try {
      const res = await fetch(`/api/bookmarks/${postId}`, {
        method: prev ? "DELETE" : "POST",
      })
      if (res.ok) {
        onChange?.(!prev)
        router.refresh()
      } else {
        setBookmarked(prev)
      }
    } catch {
      setBookmarked(prev)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      aria-label={bookmarked ? "Remove bookmark" : "Save post"}
      title={bookmarked ? "Remove bookmark" : "Save post"}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        bookmarked
          ? "text-neon hover:text-neon-light hover:bg-gray-800"
          : "text-gray-500 hover:text-neon hover:bg-gray-800"
      }`}
    >
      <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  )
}
