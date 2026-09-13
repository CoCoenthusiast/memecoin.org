"use client"
import { useCallback, useEffect, useRef, useState } from "react"

type Price = { usd: number; change24h: number }

type MarketData = {
  prices: {
    ethereum: Price
    solana: Price
  }
  updatedAt: string
}

const COINS = [
  { id: "ethereum", symbol: "ETH", label: "Ethereum" },
  { id: "solana", symbol: "SOL", label: "Solana" },
] as const

function formatUsd(v: number): string {
  if (v >= 1) {
    return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (v > 0) {
    return `$${v.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`
  }
  return "$0.00"
}

function formatChange(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null
  const sign = v >= 0 ? "+" : ""
  return `${sign}${v.toFixed(2)}%`
}

export function MarketPanel() {
  const [data, setData] = useState<MarketData | null>(null)
  const hasData = useRef(false)
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const res = await fetch("/api/market-data", { cache: "no-store" })
      if (!res.ok) throw new Error(`market-data ${res.status}`)
      const next = (await res.json()) as MarketData
      setData(next)
      hasData.current = true
    } catch {
      // silent, keep last data
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [load])

  return (
    <>
      {data && (
        <div className="fixed hidden lg:flex top-4 left-72 z-40 items-center gap-4 px-3 py-1.5 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg text-[11px] shadow-xl shadow-black/40">
          {COINS.map((c) => {
            const p = data.prices[c.id]
            const chg = formatChange(p.change24h)
            return (
              <span key={c.id} className="flex items-center gap-1.5" title={c.label}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.id === "solana" ? "bg-neon" : "bg-[#627eea]"}`} aria-hidden />
                <span className="font-semibold text-gray-300">{c.symbol}</span>
                <span className="text-gray-100 tabular-nums font-medium">{formatUsd(p.usd)}</span>
                {chg && (
                  <span className={`tabular-nums ${p.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{chg}</span>
                )}
              </span>
            )
          })}
        </div>
      )}
    </>
  )
}