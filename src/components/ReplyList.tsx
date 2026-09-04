"use client"
import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { ReactionBar } from "@/components/ReactionBar"
import { ContentActions } from "@/components/ContentActions"
import { FormattedText } from "@/components/FormattedText"
import { NewReplyForm } from "@/components/NewReplyForm"
import { StyledUsername } from "@/components/StyledUsername"
import { isUserVip } from "@/lib/vip"
import { useMentionData, extractMentions } from "@/hooks/useMentionData"

type ReplyItem = {
  id: string
  body: string
  createdAt: string
  postId: string
  parentId?: string | null
  author: {
    id: string
    username: string
    avatarUrl?: string | null
    nameStyle?: string | null
    isVip?: boolean
    vipExpiresAt?: string | null
  }
  parent?: { id: string; body?: string; author?: { username: string } } | null
  reactions: Array<{ id: string; type: string; userId: string }>
}

type ReplyListProps = {
  replies: ReplyItem[]
  currentUserId?: string
  onSuccess?: () => void
}

const PREVIEW_MAX = 70

function excerpt(text?: string): string {
  if (!text) return ""
  const collapsed = text.replace(/\s+/g, " ").trim()
  if (collapsed.length <= PREVIEW_MAX) return collapsed
  return collapsed.slice(0, PREVIEW_MAX) + "..."
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
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const allMentions = replies.flatMap((r) => extractMentions(r.body))
  const mentionData = useMentionData(allMentions)

  const scrollToReply = useCallback((replyId: string) => {
    const el = document.getElementById(`reply-${replyId}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    setHighlightId(replyId)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setHighlightId(null), 1500)
  }, [])

  if (replies.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No replies yet.</p>
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => {
        const parentUsername = reply.parent?.author?.username
        const parentExcerpt = excerpt(reply.parent?.body)

        return (
          <div
            key={reply.id}
            id={`reply-${reply.id}`}
            className={`bg-gray-900 border rounded-xl p-4 transition-all duration-300 scroll-mt-20 ${
              highlightId === reply.id
                ? "border-neon-glow ring-2 ring-neon-glow/60 shadow-[0_0_20px_-4px] shadow-neon-glow/40"
                : "border-gray-800"
            }`}
          >
            {reply.parent && parentUsername && (
              <button
                type="button"
                onClick={() => reply.parentId && scrollToReply(reply.parentId)}
                title={`Scroll to @${parentUsername}'s reply`}
                className="mb-2 flex items-start gap-2 text-left w-full bg-gray-800/40 border border-gray-700/60 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-neon-glow/60 hover:bg-gray-800/70 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <span className="min-w-0">
                  <span className="text-neon font-semibold">@{parentUsername}</span>
                  <span className="text-gray-500">: </span>
                  <span className="break-words whitespace-pre-wrap">{parentExcerpt}</span>
                </span>
              </button>
            )}
            <p className="text-sm text-gray-200 whitespace-pre-wrap">
              <FormattedText text={reply.body} mentionData={mentionData} />
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
                  <StyledUsername
                    username={reply.author.username}
                    nameStyle={reply.author.nameStyle}
                    isVip={isUserVip(reply.author)}
                  />
                </Link>
              </span>
              <span>{timeAgo(reply.createdAt)}</span>
              <button
                type="button"
                onClick={() => setReplyingToId(replyingToId === reply.id ? null : reply.id)}
                className="text-gray-500 hover:text-neon transition-colors"
              >
                Reply
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ReactionBar
                targetId={reply.id}
                type="reply"
                reactions={reply.reactions}
                currentUserId={currentUserId}
                onSuccess={onSuccess}
              />
              <ContentActions
                targetId={reply.id}
                targetType="reply"
                authorId={reply.author.id}
                createdAt={reply.createdAt}
                onSuccess={onSuccess}
              />
            </div>

            {replyingToId === reply.id && (
              <div className={`mt-3 ${parentUsername ? "ml-8" : "ml-0"}`}>
                <NewReplyForm
                  key={reply.id}
                  postId={reply.postId}
                  parentReplyId={reply.id}
                  replyingTo={reply.author.username}
                  onSuccess={() => {
                    setReplyingToId(null)
                    onSuccess?.()
                  }}
                  onCancel={() => setReplyingToId(null)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
