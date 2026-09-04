"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { useSession } from "@/hooks/useSession"
import { withinDeleteWindow } from "@/lib/deleteWindow"

const REASONS = ["Spam", "Scam", "Offensive content", "Other"]

type ContentActionsProps = {
  targetId: string
  targetType: "post" | "reply" | "user"
  authorId?: string
  createdAt?: string
  onSuccess?: () => void
}

export function ContentActions({ targetId, targetType, authorId, createdAt, onSuccess }: ContentActionsProps) {
  const { user } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const [error, setError] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  const canDelete = useMemo(() => {
    if (!user) return false
    if (targetType === "user") return false
    if (user.role === "ADMIN") return true
    return user.id === authorId && createdAt != null && withinDeleteWindow(createdAt)
  }, [user, targetType, authorId, createdAt])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  if (!user) return null
  if (targetType === "user" && user.id === targetId) return null

  async function handleReport(reason: string) {
    setError("")
    const body =
      targetType === "post"
        ? { postId: targetId, reason }
        : targetType === "reply"
          ? { replyId: targetId, reason }
          : { reportedUserId: targetId, reason }

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setMenuOpen(false)
    if (res.ok) {
      setReported(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error || "Failed to report")
    }
  }

  async function handleDelete() {
    setError("")
    const plural = { post: "posts", reply: "replies", user: "users" }[targetType]
    const res = await fetch(`/api/${plural}/${targetId}`, { method: "DELETE" })
    if (res.ok) {
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error || "Failed to delete")
    }
  }

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      {error && <span className="text-xs text-red-400">{error}</span>}

      {reported ? (
        <span className="text-xs font-medium text-neon">Reported ✓</span>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          aria-label="Report"
          className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
          title="Report"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.5l-1-2H3z" />
          </svg>
        </button>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete()
          }}
          aria-label="Delete"
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {menuOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleReport(reason)
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
