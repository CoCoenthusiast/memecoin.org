"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { timeAgo } from "@/lib/timeAgo"

type Price = { usd: number; change24h: number }

type TrendingToken = {
  name: string
  symbol: string
  address: string
  url: string
  priceUsd: number | null
  change24h: number | null
  boost: number
}

type MarketData = {
  prices: {
    ethereum: Price
    solana: Price
  }
  trending: {
    ethereum: TrendingToken[]
    solana: TrendingToken[]
  }
  updatedAt: string
}

const COINS = [
  { id: "ethereum", symbol: "ETH", label: "Ethereum" },
  { id: "solana", symbol: "SOL", label: "Solana" },
] as const

const CHAINS = [
  { id: "ethereum", label: "Ethereum", dot: "bg-[#627eea]" },
  { id: "solana", label: "Solana", dot: "bg-neon" },
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

type RunnerItem = {
  key: string
  dot: string
  token: TrendingToken
}

function RunnerRow({ item }: { item: RunnerItem }) {
  const change = formatChange(item.token.change24h)
  return (
    <a
      href={item.token.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 shrink-0 mx-4 group"
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} aria-hidden />
      <span className="text-sm font-bold text-neon shrink-0 group-hover:text-neon-light transition-colors">
        {item.token.symbol}
      </span>
      {change ? (
        <span className={`text-xs font-semibold tabular-nums shrink-0 ${item.token.change24h! >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {change}
        </span>
      ) : item.token.priceUsd !== null ? (
        <span className="text-xs text-gray-300 tabular-nums shrink-0">{formatUsd(item.token.priceUsd)}</span>
      ) : null}
      <span className="text-xs text-gray-500 truncate">{item.token.name}</span>
      <span className="text-[11px] text-indigo-400 shrink-0" aria-label="Open on DexScreener">↗</span>
    </a>
  )
}

export function MarketPanel() {
  const [data, setData] = useState<MarketData | null>(null)
  const [paused, setPaused] = useState(false)
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

  const items: RunnerItem[] = []
  for (const chain of CHAINS) {
    for (const token of data?.trending[chain.id] ?? []) {
      items.push({
        key: `${chain.id}-${items.length}-${token.address}`,
        dot: chain.dot,
        token,
      })
    }
  }

  return (
    <>
      {data && (
        <div
          className="fixed hidden lg:flex top-0 left-72 right-0 z-50 h-10 items-center px-4 border-b border-neon-glow/30 bg-gray-950/95 backdrop-blur"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-neon shrink-0">
            Top Runners
          </span>

          <div className="flex-1 min-w-0 overflow-hidden h-full flex items-center ml-4">
            {items.length > 0 ? (
              <div className="marquee-track" data-paused={paused}>
                {items.map((item) => (
                  <RunnerRow key={item.key} item={item} />
                ))}
                <div aria-hidden className="flex items-center">
                  {items.map((item) => (
                    <RunnerRow key={`dup-${item.key}`} item={item} />
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-500">No boosted tokens right now</span>
            )}
          </div>

          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 ml-4 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon" />
            </span>
            live · {timeAgo(data.updatedAt)}
          </span>
        </div>
      )}

      {data && (
        <div className="fixed hidden lg:flex top-12 left-72 z-40 items-center gap-4 px-3 py-1.5 bg-gray-950/90 backdrop-blur border border-gray-800 rounded-lg text-[11px] shadow-xl shadow-black/40">
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