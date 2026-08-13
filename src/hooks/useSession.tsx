"use client"
import { useState, useEffect, createContext, useContext, useCallback } from "react"

type Session = {
  user: { id: string; username: string; email: string; role: "USER" | "ADMIN" } | null
  loading: boolean
}

const SessionContext = createContext<Session & { refresh: () => Promise<void> }>({ user: null, loading: true, refresh: async () => {} })

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, loading: true })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setSession({ user: data.user, loading: false })
    } catch {
      setSession({ user: null, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SessionContext.Provider value={{ ...session, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
