import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
