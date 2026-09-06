"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { timeAgo } from "@/lib/timeAgo"

type Channel = {
  id: string
  slug: string
  name: string
  description: string
  _count: { posts: number }
}

type HomeData = {
  activePosts: {
    id: string
    title: string
    createdAt: string
    channel?: { slug: string; name: string }
    author: { username: string }
  }[]
  postCount: number
  memberCount: number
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/channels").then((res) => res.json()),
      fetch("/api/home").then((res) => res.json()),
    ])
      .then(([channelsData, home]) => {
        setChannels(channelsData)
        setHomeData(home)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="text-center py-10 md:py-14">
        <div className="flex items-center justify-center gap-3">
          <Logo size={48} />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-100">degenscult</h1>
        </div>
        <p className="mt-4 text-lg text-gray-400 max-w-lg mx-auto">
          Community forum for memecoin discussion and trading culture
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_19rem] gap-8 lg:items-start max-w-6xl mx-auto">
        <div className="min-w-0">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/c/${channel.slug}`}
                  className="block group p-5 bg-gray-900 border border-gray-800 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-neon-glow/40 hover:shadow-neon-glow/10"
                >
                  <h2 className="text-lg font-semibold text-gray-100 transition-colors group-hover:text-neon">{channel.name}</h2>
                  <p className="mt-1 text-sm text-gray-400 line-clamp-2">{channel.description}</p>
                  <p className="mt-3 text-xs text-gray-500">{channel._count.posts} post{channel._count.posts !== 1 ? "s" : ""}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {homeData && (
            <div className="group p-3 bg-gray-900 border border-gray-800 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-neon-glow/40 hover:shadow-neon-glow/10">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div>
                  <span className="font-semibold text-gray-200 transition-colors group-hover:text-neon">{homeData.postCount.toLocaleString()}</span> threads
                </div>
                <div className="w-px h-4 bg-gray-800" />
                <div>
                  <span className="font-semibold text-gray-200 transition-colors group-hover:text-neon">{homeData.memberCount.toLocaleString()}</span> members
                </div>
              </div>
            </div>
          )}

          {homeData && homeData.activePosts.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Active now</h2>
              <div className="space-y-2">
                {homeData.activePosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/p/${post.id}`}
                    className="block group p-3 bg-gray-900 border border-gray-800 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-neon-glow/40 hover:shadow-neon-glow/10"
                  >
                    <div className="text-xs font-medium text-gray-100 truncate transition-colors group-hover:text-neon">{post.title}</div>
                    <div className="mt-1.5 text-[11px] text-gray-500 truncate">
                      <span className="text-gray-400">{post.author.username}</span>
                      <span className="mx-1">·</span>
                      {timeAgo(post.createdAt)}
                      {post.channel && (
                        <>
                          <span className="mx-1">·</span>
                          <span className="text-indigo-400">/c/{post.channel.slug}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
