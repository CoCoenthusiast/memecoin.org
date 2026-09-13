import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api";

export const revalidate = 60;

interface CoinPrice {
  usd: number;
  change24h: number;
}

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
}

async function fetchCoinGeckoPrices(): Promise<Record<string, CoinGeckoPrice>> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return res.json();
}

export const GET = withErrorHandling(async function GET() {
  const prices = await fetchCoinGeckoPrices();

  const coin = (id: string): CoinPrice => {
    const p = prices[id];
    return { usd: p?.usd ?? 0, change24h: p?.usd_24h_change ?? 0 };
  };

  return NextResponse.json({
    prices: {
      ethereum: coin("ethereum"),
      solana: coin("solana"),
      binancecoin: coin("binancecoin"),
    },
    updatedAt: new Date().toISOString(),
  });
});
