"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import PostCard from "@/components/PostCard"

export default function ChannelPageClient({ channel: initialChannel }: { channel: any }) {
  const [channel, setChannel] = useState(initialChannel)

  const loadChannel = useCallback(async () => {
    const data = await fetch(`/api/channels/${channel.slug}`).then(r => r.ok ? r.json() : null)
    if (data) setChannel(data)
  }, [channel?.slug])

  if (!channel) return <div className="text-center text-gray-500 py-12">Channel not found</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">{channel.name}</h1>
        <p className="text-gray-400">{channel.description}</p>
      </div>
      <Link
        href={`/new-post?channel=${channel.slug}`}
        className="inline-block mb-6 px-4 py-2 rounded-lg bg-transparent border border-[#4ade80] text-[#4ade80] hover:bg-green-500/10 transition-colors"
      >
        + New Post
      </Link>
      <div className="space-y-4">
        {channel.posts?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No posts yet. Be the first!</p>
        )}
        {channel.posts?.map((post: any) => (
          <PostCard key={post.id} post={post} onContentAction={loadChannel} />
        ))}
      </div>
    </div>
  )
}
