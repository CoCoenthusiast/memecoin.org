import { NextRequest, NextResponse } from "next/server";

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getBody<T>(request: NextRequest): Promise<T> {
  return request.json();
}

export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      const digest = (error as { digest?: unknown })?.digest;
      if (
        typeof digest === "string" &&
        (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
      ) {
        throw error;
      }
      console.error("API error:", error);
      return apiError("Something went wrong", 500);
    }
  };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
