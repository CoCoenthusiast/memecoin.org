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

      const err = error as { code?: string; message?: string };

      if (err.code === "P2002") {
        return apiError("Resource already exists", 409);
      }
      if (err.code === "P2003") {
        return apiError("Invalid reference", 400);
      }
      if (err.code === "P2025") {
        return apiError("Resource not found", 404);
      }

      if (err.message?.includes("Validation failed")) {
        return apiError("Validation error", 400);
      }

      return apiError("Something went wrong", 500);
    }
  };
}

export async function parseApiError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (data.error) return data.error;

  if (res.status === 400) return "Invalid request";
  if (res.status === 401) return "You need to log in";
  if (res.status === 403) return "You don't have permission";
  if (res.status === 404) return "Not found";
  if (res.status === 409) return "This already exists";
  if (res.status === 429) return "Too many requests, try again later";
  if (res.status >= 500) return "Server error, try again later";
  return "Something went wrong";
}

export function getClientIp(request: NextRequest): string {
  // Prefer the IP set by the hosting platform's edge proxy, which overwrites
  // each request on arrival and is therefore not client-spoofable.
  // - Vercel: `x-real-ip` and `x-vercel-forwarded-for` are set by the proxy.
  // - Local dev / bare Node: nothing is set, so we fall through below.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  // Fallback for non-proxied runtimes. Take the LAST (right-most) entry, which
  // is the address appended by the closest trusted proxy; never the left-most
  // user-controlled value.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "unknown";
}
