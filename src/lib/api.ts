import { NextRequest, NextResponse } from "next/server";

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getBody<T>(request: NextRequest): Promise<T> {
  return request.json();
}
