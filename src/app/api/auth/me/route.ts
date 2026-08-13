import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session?.user ?? null });
});
