"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useSession } from "@/hooks/useSession"
import { isWithinWindow, DELETE_WINDOW_MS, EDIT_WINDOW_MS } from "@/lib/deleteWindow";

function withinDeleteWindow(createdAt: string | Date): boolean {
  return isWithinWindow(createdAt, DELETE_WINDOW_MS);
}

function withinEditWindow(createdAt: string | Date): boolean {
  return isWithinWindow(createdAt, EDIT_WINDOW_MS);
}
import { parseApiError } from "@/lib/api";

const REASONS = ["Spam", "Scam", "Offensive content", "Other"]

type Channel = { id: string; slug: string; name: string }

type ContentActionsProps = {
  targetId: string
  targetType: "post" | "reply" | "user" | "comment"
  authorId?: string
  createdAt?: string
  currentChannelId?: string
  onSuccess?: () => void
  onEdit?: () => void
}

export function ContentActions({ targetId, targetType, authorId, createdAt, currentChannelId, onSuccess, onEdit }: ContentActionsProps) {
  const { user } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [movePos, setMovePos] = useState<{ top: number; left: number } | null>(null)
  const [channels, setChannels] = useState<Channel[] | null>(null)
  const [moving, setMoving] = useState(false)
  const [reported, setReported] = useState(false)
  const [error, setError] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  const moveTriggerRef = useRef<HTMLButtonElement>(null)

  const canDelete = useMemo(() => {
    if (!user) return false
    if (targetType === "user") return false
    if (user.role === "ADMIN") return true
    return user.id === authorId && createdAt != null && withinDeleteWindow(createdAt)
  }, [user, targetType, authorId, createdAt])

  const canEdit = useMemo(() => {
    if (!user) return false
    if (targetType === "user") return false
    if (user.role === "ADMIN") return true
    return user.id === authorId && createdAt != null && withinEditWindow(createdAt)
  }, [user, targetType, authorId, createdAt])

  const canMove = !!user && user.role === "ADMIN" && targetType === "post"

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if ((e.target as HTMLElement).closest("[data-report-menu]")) return
      setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!moveOpen) return
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (moveTriggerRef.current?.contains(target)) return
      if ((e.target as HTMLElement).closest("[data-move-menu]")) return
      setMoveOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [moveOpen])

  function toggleMenu() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuHeight = REASONS.length * 36 + 8
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 8
      const top = openUp
        ? rect.top - menuHeight - 4
        : rect.bottom + 4
      const left = Math.min(rect.right, window.innerWidth - 176)
      setMenuPos({ top, left })
    }
    setMenuOpen((v) => !v)
  }

  function toggleMoveMenu() {
    if (!moveOpen && !channels) {
      fetch("/api/channels")
        .then((r) => r.ok ? r.json() : [])
        .then(setChannels)
        .catch(() => setChannels([]))
    }
    if (moveTriggerRef.current) {
      const rect = moveTriggerRef.current.getBoundingClientRect()
      const menuHeight = 200
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 8
      const top = openUp
        ? rect.top - menuHeight - 4
        : rect.bottom + 4
      const left = Math.min(rect.right, window.innerWidth - 200)
      setMovePos({ top, left })
    }
    setMoveOpen((v) => !v)
  }

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
      setError(await parseApiError(res))
    }
  }

  async function handleDelete() {
    setError("")
    const urlMap: Record<string, string> = {
      post: `/api/posts/${targetId}`,
      reply: `/api/replies/${targetId}`,
      user: `/api/users/${targetId}`,
      comment: `/api/profile-comments/${targetId}`,
    }
    const res = await fetch(urlMap[targetType], { method: "DELETE" })
    if (res.ok) {
      onSuccess?.()
    } else {
      setError(await parseApiError(res))
    }
  }

  async function handleMove(channelId: string) {
    setMoving(true)
    setError("")
    try {
      const res = await fetch(`/api/posts/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      })
      if (res.ok) {
        setMoveOpen(false)
        onSuccess?.()
      } else {
        setError(await parseApiError(res))
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="relative flex items-center gap-1">
      {error && <span className="text-xs text-red-400">{error}</span>}

      {canEdit && onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
          aria-label="Edit"
          className="p-1.5 rounded-lg text-gray-500 hover:text-neon hover:bg-gray-800 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {reported ? (
        <span className="text-xs font-medium text-neon">Reported ✓</span>
      ) : (
        <button
          ref={triggerRef}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleMenu()
          }}
          aria-label="Report"
          className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
          title="Report"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H19a2 2 0 012 2v9a2 2 0 01-2 2h-6.5l-1-2H3z" />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {canMove && (
        <button
          ref={moveTriggerRef}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleMoveMenu()
          }}
          aria-label="Move to channel"
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
          title="Move to channel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}

      {menuOpen && menuPos && createPortal(
        <div
          data-report-menu
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[9999] w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
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
        </div>,
        document.body
      )}

      {moveOpen && movePos && createPortal(
        <div
          data-move-menu
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[9999] w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
          style={{ top: movePos.top, left: movePos.left }}
        >
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-800">
            Move to channel
          </div>
          {!channels ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            channels.map((channel) => {
              const isCurrent = channel.id === currentChannelId
              return (
                <button
                  key={channel.id}
                  disabled={moving || isCurrent}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleMove(channel.id)
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                    isCurrent
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  } ${moving ? "opacity-50" : ""}`}
                >
                  {channel.name}
                  {isCurrent && <span className="ml-2 text-xs text-gray-600">(current)</span>}
                </button>
              )
            })
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
