"use client"
import { useState, useLayoutEffect, type RefObject } from "react"

type FormatToolbarProps = {
  value: string
  onChange: (v: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

export function FormatToolbar({ value, onChange, textareaRef }: FormatToolbarProps) {
  const [pendingCaret, setPendingCaret] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (pendingCaret == null) return
    const el = textareaRef.current
    if (el) {
      const pos = Math.min(pendingCaret, el.value.length)
      el.focus()
      el.setSelectionRange(pos, pos)
    }
    setPendingCaret(null)
  }, [pendingCaret, textareaRef])

  function applyBold() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const insert = selected ? `**${selected}**` : `****`
    const newValue = value.slice(0, start) + insert + value.slice(end)
    const caret = start + (selected ? selected.length + 4 : 2)
    onChange(newValue)
    setPendingCaret(caret)
  }

  function applyLink() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const url = window.prompt("Link URL:", "https://")
    if (!url || !url.trim()) return
    const trimmed = url.trim()
    const newValue = value.slice(0, start) + trimmed + value.slice(end)
    onChange(newValue)
    setPendingCaret(start + trimmed.length)
  }

  const buttonClass =
    "w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-neon hover:bg-gray-800 transition-colors cursor-pointer"

  return (
    <div className="flex items-center gap-1 mb-2">
      <button type="button" onClick={applyBold} title="Bold (adds ** **)" aria-label="Bold" className={`${buttonClass} font-bold text-sm`}>
        B
      </button>
      <button type="button" onClick={applyLink} title="Insert link" aria-label="Insert link" className={buttonClass}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.5 1.5"
          />
        </svg>
      </button>
    </div>
  )
}
