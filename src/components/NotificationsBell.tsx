"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useSession } from "@/hooks/useSession"
import { StyledUsername } from "@/components/StyledUsername";
import { timeAgo } from "@/lib/timeAgo"

type NotificationItem = {
  id: string
  message: string
  read: boolean
  postId: string
  createdAt: string
  actor?: { username: string; nameStyle?: string | null; isVip?: boolean } | null
}

const MENU_WIDTH = 320

export function NotificationsBell({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading: sessionLoading } = useSession()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (markRead: boolean) => {
    setFetching(true)
    try {
      if (markRead) {
        await fetch("/api/notifications/read", { method: "POST" })
      }
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setItems(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } finally {
      setFetching(false)
    }
  }, [])

  const positionMenu = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const vw = window.innerWidth
    const width = Math.min(MENU_WIDTH, vw - 16)
    let left = rect.left
    if (left + width > vw) left = Math.max(8, vw - width - 8)
    setCoords({ top: rect.bottom + 8, left })
  }, [])

  useEffect(() => {
    if (sessionLoading || !user) return
    load(false)
    const interval = setInterval(() => load(false), 30000)
    return () => clearInterval(interval)
  }, [sessionLoading, user, load])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const menu = menuRef.current
      const btn = buttonRef.current
      const target = e.target as Node
      if (!menu?.contains(target) && !btn?.contains(target)) {
        setOpen(false)
      }
    }
    function onMove() {
      positionMenu()
    }
    document.addEventListener("mousedown", onDocClick)
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
    }
  }, [open, positionMenu, load])

  function toggle() {
    const next = !open
    if (next) {
      positionMenu()
      load(true)
    }
    setOpen(next)
  }

  if (sessionLoading || !user) {
    return null
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="Notifications"
        title="Notifications"
        aria-expanded={open}
        className="relative p-2 rounded-lg text-gray-400 hover:text-neon hover:bg-gray-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 z-[100]"
            style={{ top: coords.top, left: coords.left, width: Math.min(MENU_WIDTH, window.innerWidth - 16) }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-semibold text-gray-100 whitespace-nowrap">Notifications</span>
              {fetching && <span className="text-xs text-gray-500">...</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 px-4 py-6 text-center">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={`/p/${n.postId}`}
                    onClick={() => {
                      setOpen(false)
                      onNavigate?.()
                    }}
                    className="block px-4 py-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800/60 last:border-b-0"
                  >
                    <p className="text-sm text-gray-200 leading-snug">
                      {n.actor && n.message.startsWith(`${n.actor.username} `) ? (
                        <>
                          <StyledUsername
                            username={`@${n.actor.username}`}
                            nameStyle={n.actor.nameStyle}
                            isVip={n.actor.isVip}
                            className="text-neon font-semibold"
                          />
                          {n.message.slice(n.actor.username.length)}
                        </>
                      ) : (
                        n.message
                      )}
                    </p>
                    <span className="text-xs text-gray-500 mt-0.5 inline-block">{timeAgo(n.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
