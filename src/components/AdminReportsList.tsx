"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type AdminReportsListProps = {
  reports: Array<{
    id: string
    reason: string
    createdAt: string
    reporter: { username: string }
    post: {
      id: string
      title: string
      body: string
      author: { username: string }
    } | null
    reply: { id: string; body: string; author: { username: string } } | null
    reportedUser: { id: string; username: string; avatarUrl: string | null } | null
  }>
}

export function AdminReportsList({ reports }: AdminReportsListProps) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleDelete(reportId: string, targetType: "post" | "reply", targetId: string) {
    setBusyId(reportId)
    setError("")
    const res = await fetch(`/api/${targetType}s/${targetId}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to delete content")
    }
    setBusyId(null)
    router.refresh()
  }

  async function handleResolve(reportId: string) {
    setBusyId(reportId)
    setError("")
    await fetch(`/api/reports/${reportId}`, { method: "PATCH" })
    setBusyId(null)
    router.refresh()
  }

  if (reports.length === 0) {
    return <p className="text-gray-500">No pending reports.</p>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
          {error}
        </div>
      )}
      {reports.map((report) => (
        <div key={report.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {report.post && (
                <>
                  <p className="text-sm font-semibold text-gray-200">{report.post.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{report.post.body}</p>
                  <p className="text-xs text-gray-500 mt-1">Post by {report.post.author.username}</p>
                </>
              )}
              {report.reply && (
                <>
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-3">{report.reply.body}</p>
                  <p className="text-xs text-gray-500 mt-1">Reply by {report.reply.author.username}</p>
                </>
              )}
              {report.reportedUser && (
                <div className="flex items-center gap-2">
                  {report.reportedUser.avatarUrl ? (
                    <img
                      src={report.reportedUser.avatarUrl}
                      alt={report.reportedUser.username}
                      className="w-6 h-6 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-200">@{report.reportedUser.username}</p>
                  <span className="text-xs text-gray-500">(user report)</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {report.post && (
                <button
                  onClick={() => handleDelete(report.id, "post", report.post!.id)}
                  disabled={busyId === report.id}
                  className="px-3 py-1.5 rounded-lg bg-transparent border border-red-500 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Apagar conteúdo
                </button>
              )}
              {report.reply && (
                <button
                  onClick={() => handleDelete(report.id, "reply", report.reply!.id)}
                  disabled={busyId === report.id}
                  className="px-3 py-1.5 rounded-lg bg-transparent border border-red-500 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Apagar conteúdo
                </button>
              )}
              <button
                onClick={() => handleResolve(report.id)}
                disabled={busyId === report.id}
                className="px-3 py-1.5 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] text-sm font-medium hover:bg-green-500/10 transition-colors disabled:opacity-50"
              >
                Ignorar denúncia
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>
              Reported by <span className="text-gray-300">{report.reporter.username}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-semibold">
              {report.reason}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
