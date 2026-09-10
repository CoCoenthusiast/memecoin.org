"use client"
import { useState, useEffect, FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { parseApiError } from "@/lib/api"

type Status = "idle" | "submitting" | "success"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<Status>("idle")

  function validate(passwordValue: string, confirmValue: string): string | null {
    if (passwordValue.length < 8 || !/[A-Z]/.test(passwordValue) || !/[0-9]/.test(passwordValue)) {
      return "Password must be at least 8 characters and include at least one uppercase letter and one number"
    }
    if (passwordValue !== confirmValue) {
      return "Passwords do not match"
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    const validationError = validate(password, confirm)
    if (validationError) {
      setError(validationError)
      return
    }

    setStatus("submitting")

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    if (!res.ok) {
      setError(await parseApiError(res))
      setStatus("idle")
      return
    }

    setStatus("success")
  }

  useEffect(() => {
    if (status !== "success") return
    const timer = setTimeout(() => {
      router.replace("/login")
    }, 1500)
    return () => clearTimeout(timer)
  }, [status, router])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
      {status === "success" ? (
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-neon-glow flex items-center justify-center text-neon-glow text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Password updated!</h1>
          <p className="text-sm text-gray-400 mb-6">Redirecting you to log in...</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10"
          >
            Go to login
          </Link>
        </div>
      ) : !token ? (
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-red-600 flex items-center justify-center text-red-400 text-2xl">
            !
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Invalid reset link</h1>
          <p className="text-sm text-gray-400 mb-6">
            This link is missing a token. Please request a new reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10"
          >
            Request a new link
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-100 text-center mb-2">Choose a new password</h1>
          <p className="text-sm text-gray-400 text-center mb-6">Your password must be at least 8 characters, with at least one uppercase letter and one number.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-400 mb-1">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-2.5 bg-transparent border border-neon-glow text-neon-glow disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40"
            >
              {status === "submitting" ? "Saving..." : "Reset password"}
            </button>
          </form>
        </>
      )}
    </div>
  )
}