"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/Logo"

type Channel = {
  id: string
  slug: string
  name: string
  description: string
  _count: { posts: number }
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setChannels(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="text-center py-12 md:py-20">
        <div className="flex items-center justify-center gap-3">
          <Logo size={48} />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-100">degenscult</h1>
        </div>
        <p className="mt-4 text-lg text-gray-400 max-w-lg mx-auto">
          Community forum for memecoin discussion and trading culture
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/c/${channel.slug}`}
              className="block p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-100">{channel.name}</h2>
              <p className="mt-1 text-sm text-gray-400 line-clamp-2">{channel.description}</p>
              <p className="mt-3 text-xs text-gray-500">{channel._count.posts} post{channel._count.posts !== 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
