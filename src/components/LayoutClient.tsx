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
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 min-h-screen">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </>
  )
}
