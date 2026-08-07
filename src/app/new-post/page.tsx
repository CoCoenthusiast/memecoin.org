"use client"
import { useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { NewPostForm } from "@/components/NewPostForm"

export default function NewPostPage() {
  const searchParams = useSearchParams()
  const channel = searchParams.get("channel") ?? undefined

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <AuthGuard>
        <NewPostForm channelSlug={channel} />
      </AuthGuard>
    </div>
  )
}
