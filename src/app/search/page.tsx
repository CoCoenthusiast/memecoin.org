"use client"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import PostCard from "@/components/PostCard"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const titlesOnly = searchParams.get("titlesOnly") === "true"
  const titlesAndFirstPostOnly = searchParams.get("titlesAndFirstPostOnly") === "true"
  const member = searchParams.get("member") ?? ""

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadResults = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      params.set("titlesOnly", String(titlesOnly))
      params.set("titlesAndFirstPostOnly", String(titlesAndFirstPostOnly))
      if (member) params.set("member", member)
      const data = await fetch(`/api/search?${params.toString()}`).then(r => (r.ok ? r.json() : []))
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [q, titlesOnly, titlesAndFirstPostOnly, member])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {q ? `Search results for "${q}"` : "Search"}
        </h1>
        {member && <p className="text-gray-400 text-sm">by {member}</p>}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Searching...</div>
      ) : results.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No results found</p>
      ) : (
        <div className="space-y-4">
          {results.map((post: any) => (
            <PostCard key={post.id} post={post} onContentAction={loadResults} />
          ))}
        </div>
      )}
    </div>
  )
}
