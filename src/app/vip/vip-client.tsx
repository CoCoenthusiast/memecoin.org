"use client"
import { useState } from "react"

const WALLET_ADDRESS = "8xJHR7CZMQnEwkoovjUQ16TVgRdQuhFGEcKVvWjvvgGd"

export function VipPageClient() {
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

  const perks = [
    "A VIP badge on your profile and on every post you make.",
    "An animated GIF on your avatar, replacing the static image.",
    "A custom banner on your profile page.",
    "A unique name color and a special name style.",
    "All of this shows up across posts, replies and mentions.",
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-12">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">VIP</h1>
        <span className="px-2 py-0.5 rounded-md border border-neon-glow text-neon-glow text-xs font-semibold tracking-wide uppercase">
          Status
        </span>
      </div>
      <p className="text-gray-400 mb-8">Support the forum and stand out at the same time.</p>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">What is VIP</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          VIP is a supporting status that also makes your profile stand out around the forum. It is not required to participate, it does not unlock hidden content, and it gives you no special power. It is a simple way to support the project and get a few nice perks in return.
        </p>
        <ul className="space-y-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon shrink-0" aria-hidden />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">How to become VIP</h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Send exactly <span className="text-neon font-semibold">0.15 SOL</span> to the forum wallet below. Double check the address before you confirm the transfer, because transactions on Solana cannot be reversed.
        </p>

        <div className="bg-gray-950 border border-gray-800 rounded-lg mb-4">
          <div className="text-xs text-gray-500 px-4 pt-3">Forum wallet (Solana)</div>
          <div className="flex items-center gap-2 px-4 pb-3">
            <code className="flex-1 text-neon font-mono text-sm break-all select-all">{WALLET_ADDRESS}</code>
            <button
              onClick={copyWallet}
              className="px-4 py-2 rounded-lg bg-transparent border border-neon-glow text-neon-glow text-sm font-semibold transition-all duration-200 hover:bg-neon-glow/10 hover:shadow-[0_0_20px_-4px] hover:shadow-neon-glow/40 whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          After the transfer, contact the admin <span className="text-neon font-semibold">CoCo</span> so your payment can be matched to your account. A short message with the amount you sent and the name of your forum account is enough.
        </p>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">How long does VIP last</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          VIP lasts for 30 days and can be renewed. When the admin grants it, VIP can also be a lifetime perk. Once VIP expires, the perks are removed from your profile until the next renewal.
        </p>
      </section>

      <div className="border border-amber-500/40 bg-amber-500/5 rounded-xl p-5">
        <p className="text-amber-300 text-sm font-medium mb-1">Please note</p>
        <p className="text-amber-200/80 text-sm leading-relaxed">
          Verification and activation are done manually by the admin. It can take some time after your payment for VIP to show up. Wait for the confirmation from CoCo before reaching out again.
        </p>
      </div>
    </div>
  )
}