"use client"
import { useRef, useCallback, type ReactNode } from "react"
import { FormatToolbar } from "@/components/FormatToolbar"
import { useMentions } from "@/components/useMentions"

type Props = {
  id?: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
  required?: boolean
}

const MENTION_REGEX = /@[A-Za-z0-9_]+/g

function highlightValue(value: string): ReactNode[] {
  if (!value) return []
  const nodes: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  MENTION_REGEX.lastIndex = 0
  while ((m = MENTION_REGEX.exec(value)) !== null) {
    if (m.index > last) nodes.push(value.slice(last, m.index))
    nodes.push(
      <span key={m.index} className="text-neon font-semibold">
        {m[0]}
      </span>
    )
    last = m.index + m[0].length
  }
  if (last < value.length) nodes.push(value.slice(last))
  return nodes
}

export function MentionTextarea({
  id,
  value,
  onChange,
  rows,
  placeholder,
  maxLength,
  required,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const { open, suggestions, activeIndex, select, handleKeyDown, close } = useMentions(
    value,
    onChange,
    ref
  )

  const syncScroll = useCallback((el: HTMLTextAreaElement) => {
    const hl = highlightRef.current
    if (!hl) return
    hl.scrollTop = el.scrollTop
    hl.scrollLeft = el.scrollLeft
  }, [])

  return (
    <div>
      <FormatToolbar value={value} onChange={onChange} textareaRef={ref} />
      <div className="relative">
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 max-h-56 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={s.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(s)
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm ${
                  i === activeIndex
                    ? "bg-neon-glow/10 text-neon"
                    : "text-gray-200 hover:bg-gray-800"
                }`}
              >
                {s.avatarUrl && (
                  <img src={s.avatarUrl} alt="" className="w-6 h-6 rounded-lg border border-gray-700" />
                )}
                <span className="whitespace-nowrap">@{s.username}</span>
              </button>
            ))}
          </div>
        )}
        <div
          ref={highlightRef}
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <span className="block whitespace-pre-wrap break-words border border-transparent px-4 py-2.5 text-gray-100">
            {highlightValue(value)}
          </span>
        </div>
        <textarea
          id={id}
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            syncScroll(e.currentTarget)
          }}
          onScroll={(e) => syncScroll(e.currentTarget)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(close, 150)}
          rows={rows}
          maxLength={maxLength}
          required={required}
          className="relative w-full px-4 py-2.5 bg-transparent text-transparent caret-gray-100 placeholder:text-gray-500 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent resize-y"
          style={{ WebkitTextFillColor: "transparent" }}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
