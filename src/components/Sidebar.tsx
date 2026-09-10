"use client"
import { useState } from "react"
import Link from "next/link"
import { useSession } from "@/hooks/useSession"
import { CHANNELS } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/Logo"
import { NotificationsBell } from "@/components/NotificationsBell"

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, loading, refresh } = useSession()
  const router = useRouter()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [titlesOnly, setTitlesOnly] = useState(false)
  const [titlesAndFirstPostOnly, setTitlesAndFirstPostOnly] = useState(false)
  const [member, setMember] = useState("")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQ.trim()) params.set("q", searchQ.trim())
    params.set("titlesOnly", String(titlesOnly))
    params.set("titlesAndFirstPostOnly", String(titlesAndFirstPostOnly))
    if (member.trim()) params.set("member", member.trim())
    router.push(`/search?${params.toString()}`)
    onClose()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" onClick={onClose} className="flex items-center gap-2 text-xl font-black text-neon hover:text-neon-light transition-colors">
            <Logo size={28} />
            degenscult
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsBell onNavigate={onClose} />
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              title="Search"
              className="p-2 rounded-lg text-gray-400 hover:text-neon hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-400">GM degens 🚀</p>

        {searchOpen && (
          <div className="mt-4 p-3 bg-gray-800/60 border border-gray-700 rounded-xl space-y-3">
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
              placeholder="Search..."
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={titlesAndFirstPostOnly}
                onChange={(e) => setTitlesAndFirstPostOnly(e.target.checked)}
                className="accent-neon"
              />
              Search titles and first posts only
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={titlesOnly}
                onChange={(e) => setTitlesOnly(e.target.checked)}
                className="accent-neon"
              />
              Search titles only
            </label>
            <input
              value={member}
              onChange={(e) => setMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
              placeholder="Member"
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent text-sm"
            />
            <button
              onClick={handleSearch}
              className="w-full py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors"
            >
              Search
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">Channels</div>
        {CHANNELS.map((channel) => (
          <Link
            key={channel.slug}
            href={`/c/${channel.slug}`}
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {channel.name}
          </Link>
        ))}

        {user && user.role === "ADMIN" && (
          <div className="pt-3">
            <Link
              href="/admin/reports"
              onClick={onClose}
              className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        )}

        <div className="pt-3">
          <Link
            href="/about"
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            About
          </Link>
        </div>

        <div className="pt-1">
          <Link
            href="/leaderboard"
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Leaderboard
          </Link>
        </div>

        <div className="pt-1">
          <Link
            href="/vip"
            onClick={onClose}
            className="block px-3 py-2 rounded-lg text-sm text-neon font-medium hover:bg-gray-800 hover:text-neon-light transition-colors"
          >
            VIP
          </Link>
        </div>

        <div className="pt-4">
          <Link
            href="/new-post"
            onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors"
          >
            New Post
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-1 mb-3">
          <a
            href="https://x.com/degenscult"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X — @degenscult"
            title="X — @degenscult"
            className="p-2 rounded-lg text-gray-500 hover:text-neon hover:bg-gray-800 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@degenscultt"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok — @degenscultt"
            title="TikTok — @degenscultt"
            className="p-2 rounded-lg text-gray-500 hover:text-neon hover:bg-gray-800 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </a>
        </div>
        {loading ? (
          <div className="h-8 bg-gray-800 rounded animate-pulse" />
        ) : user ? (
          <div className="space-y-2">
            <Link
              href={`/profile/${user.username}`}
              onClick={onClose}
              className="block text-sm text-gray-300 hover:text-white transition-colors"
            >
              Signed in as <span className="font-medium text-gray-100">{user.username}</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                await refresh()
                router.push("/")
                router.refresh()
              }}
              className="text-sm text-neon hover:text-neon-light transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/login"
              onClick={onClose}
              className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex-1 text-center px-3 py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-gray-900 shadow-xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
