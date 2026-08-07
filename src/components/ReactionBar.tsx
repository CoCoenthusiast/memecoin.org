"use client"
import { useRouter } from "next/navigation"
import { useSession } from "@/hooks/useSession"

type ReactionBarProps = {
  targetId: string
  type: "post" | "reply"
  reactions: Array<{ id: string; type: string; userId: string }>
  currentUserId?: string
}

const EMOJIS: Record<string, string> = {
  Like: "👍",
  Dislike: "👎",
  Funny: "😂",
  Sad: "😢",
}

const TYPES = ["Like", "Dislike", "Funny", "Sad"]

export function ReactionBar({ targetId, type, reactions, currentUserId }: ReactionBarProps) {
  const { user } = useSession()
  const router = useRouter()

  async function handleReaction(reactionType: string) {
    if (!user) {
      router.push("/login")
      return
    }

    const body: Record<string, string> = { type: reactionType }
    if (type === "post") body.postId = targetId
    else body.replyId = targetId

    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    router.refresh()
  }

  const counts: Record<string, number> = {}
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] || 0) + 1
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TYPES.map((reactionType) => {
        const count = counts[reactionType] || 0
        const isActive = currentUserId
          ? reactions.some((r) => r.type === reactionType && r.userId === currentUserId)
          : false

        return (
          <button
            key={reactionType}
            onClick={() => handleReaction(reactionType)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span className="text-base leading-none">{EMOJIS[reactionType]}</span>
            <span className="text-xs font-medium">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
