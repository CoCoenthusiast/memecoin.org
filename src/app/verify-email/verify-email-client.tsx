"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "@/hooks/useSession"

type Status =
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string }
  | { kind: "idle" }

function errorMessage(reason: string): string {
  switch (reason) {
    case "missing-token":
      return "We couldn't verify your email because the link is missing a token. Please check the link from your email."
    case "invalid-token":
      return "This verification link is invalid or has already been used."
    case "expired-token":
      return "This verification link has expired. Please request a new one."
    default:
      return "Something went wrong while verifying your email. Please try again."
  }
}

export function VerifyEmail() {
  const searchParams = useSearchParams()
  const { refresh } = useSession()
  const [status, setStatus] = useState<Status>({ kind: "verifying" })

  useEffect(() => {
    const token = searchParams.get("token")
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (token) {
      let cancelled = false
      setStatus({ kind: "verifying" })
      ;(async () => {
        try {
          const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
            cache: "no-store",
          })
          const data = await res.json().catch(() => ({}))
          if (cancelled) return
          if (res.ok && data.verified) {
            setStatus({ kind: "success" })
            refresh()
          } else {
            setStatus({ kind: "error", message: errorMessage(data.error) })
          }
        } catch {
          if (!cancelled) {
            setStatus({ kind: "error", message: "Something went wrong while verifying your email. Please try again." })
          }
        }
      })()
      return () => {
        cancelled = true
      }
    }

    if (success === "true") {
      setStatus({ kind: "success" })
      refresh()
      return
    }

    if (error) {
      setStatus({ kind: "error", message: errorMessage(error) })
      return
    }

    setStatus({ kind: "idle" })
  }, [searchParams, refresh])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
      {status.kind === "verifying" && (
        <p className="text-sm text-gray-400">Checking your verification link...</p>
      )}

      {status.kind === "success" && (
        <>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-neon-glow flex items-center justify-center text-neon-glow text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Email verified!</h1>
          <p className="text-sm text-gray-400 mb-6">You can now post.</p>
        </>
      )}

      {status.kind === "error" && (
        <>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-red-600 flex items-center justify-center text-red-400 text-2xl">
            !
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Couldn't verify your email</h1>
          <p className="text-sm text-gray-400 mb-2">{status.message}</p>
          <p className="text-xs text-gray-500 mb-6">
            You can request a new verification link from your profile after logging in.
          </p>
        </>
      )}

      {status.kind === "idle" && (
        <>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 text-2xl">
            ✉
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Almost there!</h1>
          <p className="text-sm text-gray-400 mb-6">
            We sent a verification link to your email. Check your inbox (and spam) to confirm your address.
          </p>
        </>
      )}

      <Link
        href="/"
        className="inline-block px-6 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10"
      >
        Back to home
      </Link>
    </div>
  )
}