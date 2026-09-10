"use client"
import { useState, FormEvent } from "react"
import Link from "next/link"
import { parseApiError } from "@/lib/api"

type Status = "idle" | "sending" | "sent"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setStatus("sending")

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      setError(await parseApiError(res))
      setStatus("idle")
      return
    }

    setStatus("sent")
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
      {status === "sent" ? (
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-neon-glow flex items-center justify-center text-neon-glow text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Check your email</h1>
          <p className="text-sm text-gray-400 mb-2">
            If an account exists for that email, we sent a link to reset your password.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-transparent border border-neon-glow text-neon-glow font-medium transition-all duration-200 hover:bg-neon-glow/10"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-100 text-center mb-2">Reset your password</h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-glow focus:border-transparent"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-2.5 bg-transparent border border-neon-glow text-neon-glow disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40"
            >
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Log in</Link>
          </p>
        </>
      )}
    </div>
  )
}