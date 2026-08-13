import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", sessionCookieOptions(0));

  return NextResponse.json({ ok: true });
});
