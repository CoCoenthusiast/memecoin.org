import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api";

export const revalidate = 60;

// Chains to scan for top runners.
const CHAINS = [
  { id: "solana", label: "Solana" },
  { id: "robinhood", label: "Robinhood" },
] as const;

// Max tokens shown in the rotating panel on the home page.
const MAX_PER_PANEL = 6;

// 24-hour window in milliseconds — only tokens created within this
// window are considered as "runners".
const HOURS_24_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// DATA SOURCE CHOICE (documented per user request)
//
// We use DexScreener's free API as the primary data source for two reasons:
//
// 1. DexScreener exposes volume (h24) AND the DEX identifier (dexId) for each
//    pair, which lets us calculate fees using known on-chain fee rates — no
//    paid API key required.
//
// 2. Birdeye (another option) has a "globalFees" field in its token overview
//    endpoint, but it requires an API key even on the free tier (returns
//    "Unauthorized" without one). Solscan and Jupiter APIs also don't expose
//    accumulated fees per token in their free tiers.
//
// So the approach is:
//   fees_24h = volume_24h × fee_rate(dexId)
//
// Known fee rates (publicly documented by each DEX):
//   - pumpfun (Pump.fun bonding curve): 1.0%
//   - pumpswap (PumpSwap / Pump.fun AMM): 0.25%
//   - raydium (Raydium V4 / CPMM): 0.25%
//   - uniswap (Uniswap V3 on Robinhood chain): 0.30%
//   - fallback for unknown DEXes: 0.30%
// ---------------------------------------------------------------------------

// Fee rate per DEX, used to convert volume into "fees paid".
const FEE_RATES: Record<string, number> = {
  pumpfun: 0.01,
  pumpswap: 0.0025,
  raydium: 0.0025,
  uniswap: 0.003,
};
const DEFAULT_FEE_RATE = 0.003;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinPrice {
  usd: number;
  change24h: number;
}

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
}

interface BoostItem {
  chainId: string;
  tokenAddress: string;
  url: string;
  description: string | null;
  totalAmount: number;
}

interface DexPair {
  baseToken?: { name?: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  pairCreatedAt?: number;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number };
  dexId?: string;
}

interface EnrichedToken {
  name: string;
  symbol: string;
  address: string;
  chain: string;
  url: string;
  priceUsd: number | null;
  change24h: number | null;
  boost: number;
  pairCreatedAt: number | null;
  volume24h: number;
  fees24h: number;
  dexId: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchCoinGeckoPrices(): Promise<Record<string, CoinGeckoPrice>> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return res.json();
}

async function fetchDexScreenerBoosts(): Promise<BoostItem[]> {
  const res = await fetch("https://api.dexscreener.com/token-boosts/latest/v1", {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`DexScreener error: ${res.status}`);
  return res.json();
}

async function fetchPair(chainId: string, address: string): Promise<DexPair> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/${chainId}/${address}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return {};
    const pairs = (await res.json()) as DexPair[];
    return Array.isArray(pairs) ? (pairs[0] ?? {}) : {};
  } catch {
    return {};
  }
}

function estimateFees(volume24h: number, dexId: string): number {
  const rate = FEE_RATES[dexId] ?? DEFAULT_FEE_RATE;
  return volume24h * rate;
}

function enrichToken(boost: BoostItem, pair: DexPair, chainLabel: string): EnrichedToken {
  const volume24h = pair.volume?.h24 ?? 0;
  const dexId = pair.dexId ?? "unknown";
  return {
    name: pair.baseToken?.name ?? boost.description?.split("\n")[0]?.slice(0, 40) ?? "Unknown",
    symbol: pair.baseToken?.symbol ?? boost.tokenAddress.slice(0, 6),
    address: boost.tokenAddress,
    chain: chainLabel,
    url: boost.url,
    priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
    change24h: typeof pair.priceChange?.h24 === "number" ? pair.priceChange.h24 : null,
    boost: boost.totalAmount,
    pairCreatedAt: pair.pairCreatedAt ?? null,
    volume24h,
    fees24h: estimateFees(volume24h, dexId),
    dexId,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const GET = withErrorHandling(async function GET() {
  const [pricesResult, boostsResult] = await Promise.allSettled([
    fetchCoinGeckoPrices(),
    fetchDexScreenerBoosts(),
  ]);

  const prices = pricesResult.status === "fulfilled" ? pricesResult.value : {};
  const boosts = boostsResult.status === "fulfilled" ? boostsResult.value : [];

  const coin = (id: string): CoinPrice => {
    const p = prices[id];
    return { usd: p?.usd ?? 0, change24h: p?.usd_24h_change ?? 0 };
  };

  const now = Date.now();
  const trending: Record<string, EnrichedToken[]> = {};

  for (const chain of CHAINS) {
    const chainBoosts = boosts.filter((b) => b.chainId === chain.id);

    // Fetch pair metadata (volume, dexId, pairCreatedAt, price) for each token.
    const pairs = await Promise.all(
      chainBoosts.map((b) => fetchPair(chain.id, b.tokenAddress))
    );

    const enriched = chainBoosts.map((b, i) => enrichToken(b, pairs[i], chain.label));

    // RULE 1: Only tokens created in the last 24 hours.
    // Tokens without a known creation date are excluded.
    const recent = enriched.filter((t) => {
      if (t.pairCreatedAt === null) return false;
      return now - t.pairCreatedAt < HOURS_24_MS;
    });

    // RULE 2: Rank exclusively by estimated global fees paid (24h).
    // fees_24h = volume_24h × fee_rate(dexId). See FEE_RATES above.
    // This is the sole selection criterion — market cap is NOT used.
    const byFees = [...recent].sort((a, b) => b.fees24h - a.fees24h);
    trending[chain.id] = byFees.slice(0, MAX_PER_PANEL);
  }

  return NextResponse.json({
    prices: {
      ethereum: coin("ethereum"),
      solana: coin("solana"),
      binancecoin: coin("binancecoin"),
    },
    trending,
    updatedAt: new Date().toISOString(),
  });
});
