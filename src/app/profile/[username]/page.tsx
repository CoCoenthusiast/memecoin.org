"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import PostCard from "@/components/PostCard"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [username])

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>
  if (!user) return <div className="text-center text-gray-500 py-12">User not found</div>

  const posts = user.posts ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
        <p className="text-gray-400">Member since {formatDate(user.createdAt)}</p>
        <p className="text-gray-400">{user.totalReactions ?? 0} reactions received</p>
      </div>
      <h2 className="text-lg font-semibold mb-4">Posts</h2>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No posts yet</p>
        ) : (
          [...posts]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((post: any) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}
