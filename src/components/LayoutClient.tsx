"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/Sidebar"

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 text-gray-400 hover:text-gray-100 transition-colors bg-gray-900/80 rounded-lg border border-gray-800"
        aria-label="Open sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 md:p-8 min-h-screen">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
        <footer className="text-xs text-gray-600 text-center py-4 px-4 border-t border-gray-800">
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          {" · "}
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          {" · "}
          <Link href="/disclaimer" className="hover:text-gray-400 transition-colors">Disclaimer</Link>
          {" · "}
          <Link href="/about" className="hover:text-gray-400 transition-colors">About</Link>
          {" · "}
          <a href="mailto:degenscult.support@gmail.com" className="hover:text-gray-400 transition-colors">Contact</a>
          {" · © 2026 degenscult"}
        </footer>
      </div>
    </>
  )
}
