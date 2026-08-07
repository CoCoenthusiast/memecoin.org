"use client"
import { useSession } from "@/hooks/useSession"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!user) return null
  return <>{children}</>
}
