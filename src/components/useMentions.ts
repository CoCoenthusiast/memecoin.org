"use client"
import { useState, useEffect, useCallback, useRef } from "react"

type Suggestion = { id: string; username: string; avatarUrl?: string | null }

export function useMentions(
  value: string,
  onChange: (v: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const tokenStartRef = useRef(-1)
  const tokenEndRef = useRef(0)

  const refreshToken = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const caret = el.selectionStart
    const text = el.value
    let i = caret - 1
    while (i >= 0 && /[A-Za-z0-9_@]/.test(text[i])) {
      if (text[i] === "@") break
      i--
    }
    const start = i
    const token = text.slice(start, caret)
    if (token.startsWith("@") && token.length > 1) {
      tokenStartRef.current = start
      tokenEndRef.current = caret
      const q = token.slice(1)
      setSuggestions([])
      setActiveIndex(0)
      return q
    }
    tokenStartRef.current = -1
    setOpen(false)
    return null
  }, [textareaRef])

  useEffect(() => {
    const q = refreshToken()
    if (q === null) {
      setOpen(false)
      return
    }
    setOpen(true)
    let cancelled = false
    const t = setTimeout(async () => {
      if (!q) {
        if (!cancelled) setSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setSuggestions(data.users ?? [])
          setActiveIndex(0)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [value, refreshToken])

  function select(sug: Suggestion | undefined) {
    if (!sug) return
    const el = textareaRef.current
    if (!el) return
    const name = sug.username
    const start = tokenStartRef.current
    const end = tokenEndRef.current
    if (start < 0) return
    const next = value.slice(0, start) + `@${name} ` + value.slice(end)
    onChange(next)
    setOpen(false)
    requestAnimationFrame(() => {
      const caret = start + 1 + name.length + 1
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const close = useCallback(() => {
    setOpen(false)
    setSuggestions([])
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      select(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  return { open, suggestions, activeIndex, select, handleKeyDown, close }
}
