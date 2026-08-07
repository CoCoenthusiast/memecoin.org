"use client"
import Link from "next/link"
import { useSession } from "@/hooks/useSession"
import { CHANNELS } from "@/lib/constants"
import { useRouter } from "next/navigation"

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, loading } = useSession()
  const router = useRouter()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="px-6 py-5 border-b border-gray-800">
        <Link href="/" onClick={onClose} className="flex items-center gap-3 text-xl font-black text-[#4ade80] hover:text-green-300 transition-colors">
          memecoins.org
          <span className="bg-green-500/10 text-green-400 rounded-full px-2 py-0.5 text-xs font-semibold">
            LIVE
          </span>
        </Link>
        <p className="mt-1 text-sm text-gray-400">GM degens 🚀</p>
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

        <div className="pt-4">
          <Link
            href="/new-post"
            onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] text-sm font-medium hover:bg-green-500/10 transition-colors"
          >
            New Post
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        {loading ? (
          <div className="h-8 bg-gray-800 rounded animate-pulse" />
        ) : user ? (
          <div className="space-y-2">
            <Link
              href={`/u/${user.username}`}
              onClick={onClose}
              className="block text-sm text-gray-300 hover:text-white transition-colors"
            >
              Signed in as <span className="font-medium text-gray-100">{user.username}</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                router.push("/")
                router.refresh()
              }}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
              className="flex-1 text-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
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
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
