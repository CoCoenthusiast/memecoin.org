"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import PostCard from "@/components/PostCard"

export default function ChannelPage() {
  const params = useParams()
  const slug = params.slug as string
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/channels/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setChannel(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!channel) return <div className="text-center text-gray-500 py-12">Channel not found</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">{channel.name}</h1>
        <p className="text-gray-400">{channel.description}</p>
      </div>
      <Link
        href={`/new-post?channel=${slug}`}
        className="inline-block mb-6 px-4 py-2 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] hover:bg-green-500/10 transition-colors"
      >
        + New Post
      </Link>
      <div className="space-y-4">
        {channel.posts?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No posts yet. Be the first!</p>
        )}
        {channel.posts?.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
