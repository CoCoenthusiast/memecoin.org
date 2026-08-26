"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/hooks/useSession"

type ReactionBarProps = {
  targetId: string
  type: "post" | "reply"
  reactions: Array<{ id: string; type: string; userId: string }>
  currentUserId?: string
  onSuccess?: () => void
}

const EMOJIS: Record<string, string> = {
  Like: "👍",
  Dislike: "👎",
  Funny: "😂",
  Sad: "😢",
}

const TYPES = ["Like", "Dislike", "Funny", "Sad"]

export function ReactionBar({ targetId, type, reactions, currentUserId, onSuccess }: ReactionBarProps) {
  const { user } = useSession()
  const router = useRouter()
  const [localReactions, setLocalReactions] = useState(reactions)
  const [pending, setPending] = useState<string | null>(null)

  async function handleReaction(reactionType: string) {
    if (!user) {
      router.push("/login")
      return
    }

    const prev = localReactions
    setPending(reactionType)

    const existing = localReactions.find(
      (r) => r.type === reactionType && r.userId === user.id
    )
    const toggledOff = !!existing

    if (toggledOff) {
      setLocalReactions((rs) => rs.filter((r) => r !== existing))
    } else {
      setLocalReactions((rs) => [
        ...rs,
        { id: `opt-${Date.now()}`, type: reactionType, userId: user.id },
      ])
    }

    const body: Record<string, string> = { type: reactionType }
    if (type === "post") body.postId = targetId
    else body.replyId = targetId

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setLocalReactions(prev)
      } else {
        onSuccess?.()
      }
    } catch {
      setLocalReactions(prev)
    } finally {
      setPending(null)
    }
  }

  const counts: Record<string, number> = {}
  for (const r of localReactions) {
    counts[r.type] = (counts[r.type] || 0) + 1
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TYPES.map((reactionType) => {
        const count = counts[reactionType] || 0
        const isActive = currentUserId
          ? localReactions.some((r) => r.type === reactionType && r.userId === currentUserId)
          : false
        const isPending = pending === reactionType

        return (
          <button
            key={reactionType}
            onClick={() => handleReaction(reactionType)}
            disabled={isPending}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
            } ${isPending ? "opacity-50" : ""}`}
          >
            <span className="text-base leading-none">{EMOJIS[reactionType]}</span>
            <span className="text-xs font-medium">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
