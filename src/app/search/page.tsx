"use client"
import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import PostCard from "@/components/PostCard"
import { StyledUsername } from "@/components/StyledUsername"
import { isUserVip } from "@/lib/vip"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const titlesOnly = searchParams.get("titlesOnly") === "true"
  const titlesAndFirstPostOnly = searchParams.get("titlesAndFirstPostOnly") === "true"
  const member = searchParams.get("member") ?? ""

  const [results, setResults] = useState<any[]>([])
  const [memberProfile, setMemberProfile] = useState<any>(null)
  const [memberMissing, setMemberMissing] = useState(false)
  const [loading, setLoading] = useState(true)

  const memberOnly = member.trim() !== "" && q.trim() === ""

  const loadResults = useCallback(async () => {
    setLoading(true)
    setMemberMissing(false)
    try {
      if (member.trim() && !q.trim()) {
        // Member-only search: surface the member's profile as the result.
        const prof = await fetch(`/api/users/${encodeURIComponent(member)}`).then((r) =>
          r.ok ? r.json() : null
        )
        setMemberProfile(prof)
        setMemberMissing(!prof)
        setResults([])
        return
      }

      const params = new URLSearchParams()
      if (q) params.set("q", q)
      params.set("titlesOnly", String(titlesOnly))
      params.set("titlesAndFirstPostOnly", String(titlesAndFirstPostOnly))
      if (member) params.set("member", member)
      const data = await fetch(`/api/search?${params.toString()}`).then((r) => (r.ok ? r.json() : []))
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
        {member && (
          <p className="text-gray-400 text-sm">{memberOnly ? `Member: ${member}` : `by ${member}`}</p>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Searching...</div>
      ) : memberOnly ? (
        memberProfile ? (
          <Link href={`/profile/${memberProfile.username}`} className="block group">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 transition-colors group-hover:border-neon-glow/40">
              <div className="flex-shrink-0">
                {memberProfile.avatarUrl ? (
                  <img
                    src={memberProfile.avatarUrl}
                    alt={memberProfile.username}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-gray-100 group-hover:text-neon transition-colors">
                  <StyledUsername
                    username={memberProfile.username}
                    nameStyle={memberProfile.nameStyle}
                    isVip={isUserVip(memberProfile)}
                  />
                </div>
                <div className="text-sm text-gray-400">Member since {formatDate(memberProfile.createdAt)}</div>
                <div className="flex gap-5 mt-2 text-xs text-gray-500">
                  <span>
                    <span className="font-semibold text-gray-200">{memberProfile.postCount}</span> posts
                  </span>
                  <span>
                    <span className="font-semibold text-gray-200">{memberProfile.replyCount}</span> replies
                  </span>
                  <span>
                    <span className="font-semibold text-neon">{memberProfile.totalReactions}</span> reactions
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <p className="text-gray-500 text-center py-12">No member found</p>
        )
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
