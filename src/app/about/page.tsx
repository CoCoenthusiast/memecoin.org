"use client"
import { useState } from "react"

const WALLET_ADDRESS = "HeBzuaH1Ehng5XmMyCrSx7FZGN5x7HYx5YKY8fV9KFBm";

export default function AboutPage() {
  const [copied, setCopied] = useState(false)

  async function copyWallet() {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8">About degenscult</h1>

      <p className="text-gray-200 text-lg leading-relaxed mb-6">
        I created this forum to be a real place for people who are into memecoins. Whether you&apos;re a complete beginner or you&apos;ve been in this market for years, the idea is that everyone can share ideas, ask questions and help each other in one place — without that mess of a Discord or Telegram group where everything disappears after a day.
      </p>

      <p className="text-gray-200 text-lg leading-relaxed mb-6">
        I want this to be a healthy space. That means no scams, no people pushing worthless tokens on others, and no drama. Just real mutual support between people who like this market.
      </p>

      <p className="text-gray-200 text-lg leading-relaxed mb-10">
        This project is made by me, alone, in my free time. There&apos;s no company behind it, no investors — it&apos;s just me trying to build something nice for the community. If the forum has helped you in any way and you want to give me a hand to keep improving the site (paying for hosting, adding new features, etc.), I accept donations in Solana. It&apos;s totally optional, nobody is obligated to do anything.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <div className="text-sm text-gray-400 mb-3">Wallet address (Solana):</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-[#4ade80] font-mono text-sm break-all select-all">
            {WALLET_ADDRESS}
          </code>
          <button
            onClick={copyWallet}
            className="px-4 py-3 rounded-lg bg-[#4ade80] text-gray-950 text-sm font-semibold hover:bg-green-300 transition-colors whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm leading-relaxed">
        One note: donations here are voluntary and there&apos;s no going back. They give you no special access or stake in the project, and they are not an investment in anything.
      </p>
    </div>
  )
}
