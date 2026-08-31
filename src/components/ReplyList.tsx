import Link from "next/link"
import { ReactionBar } from "@/components/ReactionBar"
import { ContentActions } from "@/components/ContentActions"
import { FormattedText } from "@/components/FormattedText"

type ReplyListProps = {
  replies: Array<{
    id: string
    body: string
    createdAt: string
    author: { id: string; username: string; avatarUrl?: string | null }
    reactions: Array<{ id: string; type: string; userId: string }>
  }>
  currentUserId?: string
  onSuccess?: () => void
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function ReplyList({ replies, currentUserId, onSuccess }: ReplyListProps) {
  if (replies.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No replies yet.</p>
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <div key={reply.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            <FormattedText text={reply.body} />
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              {reply.author.avatarUrl && (
                <img
                  src={reply.author.avatarUrl}
                  alt={reply.author.username}
                  className="w-8 h-8 rounded-lg object-cover border border-gray-700"
                />
              )}
              <Link
                href={`/profile/${reply.author.username}`}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {reply.author.username}
              </Link>
            </span>
            <span>{timeAgo(reply.createdAt)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ReactionBar
              targetId={reply.id}
              type="reply"
              reactions={reply.reactions}
              currentUserId={currentUserId}
              onSuccess={onSuccess}
            />
            <ContentActions targetId={reply.id} targetType="reply" onSuccess={onSuccess} />
          </div>
        </div>
      ))}
    </div>
  )
}
