"use client"
import { useEffect, useState } from "react"
import { FormattedText } from "@/components/FormattedText"
import { timeAgo } from "@/lib/timeAgo"

type Recap = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

export function TrackerFeed() {
  const [recap, setRecap] = useState<Recap | null | "loading">("loading")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/daily-recap/latest", { cache: "no-store" })
        if (!res.ok) throw new Error("daily-recap latest")
        const data = await res.json()
        if (!cancelled) setRecap(data.recap ?? null)
      } catch {
        if (!cancelled) setRecap(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <aside
      className="fixed top-0 right-0 bottom-0 w-72 z-30 hidden xl:flex flex-col border-l border-gray-800 bg-[#0a0a0a]"
      aria-label="Tracker feed"
    >
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tracker Feed</h2>
          {recap !== "loading" && recap && (
            <span className="text-[11px] text-gray-500">{timeAgo(recap.createdAt)}</span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {recap === "loading" ? (
          <div className="space-y-3" aria-busy aria-label="Loading daily recap">
            <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
            <div className="h-64 bg-gray-800/70 rounded-xl animate-pulse" />
          </div>
        ) : recap ? (
          <>
            <h3 className="text-xl font-bold text-gray-100 mb-3 leading-snug">{recap.title}</h3>
            {recap.imageUrl && (
              <img
                src={recap.imageUrl}
                alt={recap.title}
                className="w-full max-h-72 object-cover rounded-lg mb-4"
              />
            )}
            <div className="text-[15px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
              <FormattedText text={recap.content} />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No recap published yet.</p>
        )}
      </div>
    </aside>
  )
}