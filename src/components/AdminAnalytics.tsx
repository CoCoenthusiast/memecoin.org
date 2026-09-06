"use client"
import { useState, useEffect } from "react"

type AnalyticsData = {
  activeUsers7d: number
  activeUsers30d: number
  newPostsPerDay: { date: string; count: number }[]
  users: { total: number; vip: number }
  totals: { posts: number; replies: number; reactions: number }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  )
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load analytics")
        return res.json()
      })
      .then(setData)
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading analytics...</p>
  if (error) return <p className="text-red-400 text-sm">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Active users (7 days)" value={data.activeUsers7d} />
        <StatCard label="Active users (30 days)" value={data.activeUsers30d} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total users" value={data.users.total} />
        <StatCard label="Active VIPs" value={data.users.vip} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total posts" value={data.totals.posts} />
        <StatCard label="Total replies" value={data.totals.replies} />
        <StatCard label="Total reactions" value={data.totals.reactions} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Posts per day (last 14 days)</h3>
        {data.newPostsPerDay.length === 0 ? (
          <p className="text-gray-500 text-sm">No posts in the last 14 days.</p>
        ) : (
          <div className="space-y-2">
            {[...data.newPostsPerDay].reverse().map((day) => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{day.date}</span>
                <span className="text-white font-medium">{day.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
