"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type VipUser = {
  id: string
  username: string
  vipExpiresAt: string | null
  vip: boolean
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function VipManagement() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [searched, setSearched] = useState("")
  const [user, setUser] = useState<VipUser | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const q = username.trim()
    if (!q) return
    const res = await fetch(`/api/admin/vip?username=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      setSearched(data.user.username)
      setNotFound(false)
    } else if (res.status === 404) {
      setUser(null)
      setSearched(username.trim())
      setNotFound(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Failed to search")
    }
  }

  async function runAction(action: "grant" | "renew" | "revoke") {
    if (!user) return
    setBusy(action)
    setError("")
    try {
      const res = await fetch("/api/admin/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setSearched(data.user.username)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to update VIP")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-1">VIP Management</h2>
      <p className="text-gray-400 text-sm mb-4">Search a user to grant, renew, or revoke VIP.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Search by username..."
          className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {notFound && (
        <p className="text-sm text-gray-400">
          No user found for &quot;{searched}&quot;.
        </p>
      )}

      {user && (
        <div className="border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-100">@{user.username}</p>
              <p className="text-xs text-gray-400 mt-1">
                {user.vip ? (
                  <>VIP active until <span className="text-neon font-medium">{formatDate(user.vipExpiresAt)}</span></>
                ) : (
                  <>Not VIP</>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => runAction("grant")}
              disabled={busy !== null}
              className="px-3 py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors disabled:opacity-50"
            >
              {busy === "grant" ? "Granting..." : "Grant VIP (30 days)"}
            </button>
            <button
              onClick={() => runAction("renew")}
              disabled={busy !== null}
              className="px-3 py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-medium hover:bg-neon-glow/10 transition-colors disabled:opacity-50"
            >
              {busy === "renew" ? "Renewing..." : "Renew (+30 days)"}
            </button>
            <button
              onClick={() => runAction("revoke")}
              disabled={busy !== null}
              className="px-3 py-2 rounded-lg bg-transparent border border-red-500 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {busy === "revoke" ? "Revoking..." : "Revoke VIP"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
