import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

function normalize(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p;
}

function isPublicRoute(method: string, pathname: string): boolean {
  const p = normalize(pathname);

  if (method === "GET") {
    if (p === "/api/auth/me") return true;
    if (p === "/api/channels") return true;
    if (/^\/api\/channels\/[^/]+$/.test(p)) return true;
    if (p === "/api/home") return true;
    if (/^\/api\/posts\/[^/]+$/.test(p)) return true;
    if (p === "/api/search") return true;
    if (p === "/api/users/search") return true;
    if (/^\/api\/users\/[^/]+$/.test(p)) return true;
    if (/^\/api\/users\/[^/]+\/comments$/.test(p)) return true;
    return false;
  }

  if (method === "POST") {
    if (
      p === "/api/auth/login" ||
      p === "/api/auth/register" ||
      p === "/api/auth/logout"
    ) {
      return true;
    }
    if (p === "/api/mentions/data") return true;
    return false;
  }

  return false;
}

function isAdminRoute(method: string, pathname: string): boolean {
  const p = normalize(pathname);

  if (p === "/api/admin" || p.startsWith("/api/admin/")) return true;
  if (method === "POST" && /^\/api\/posts\/[^/]+\/pin$/.test(p)) return true;
  if (method === "PATCH" && /^\/api\/reports\/[^/]+$/.test(p)) return true;

  return false;
}

type Payload = { userId: string; role: string; tokenVersion?: number };

function parseToken(request: NextRequest): Payload | null {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as Payload;
  } catch {
    return null;
  }
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // CORS preflight requests must never be gated.
  if (request.method === "OPTIONS") return NextResponse.next();

  const method = request.method;

  if (isPublicRoute(method, pathname)) return NextResponse.next();

  const payload = parseToken(request);
  if (!payload) return unauthorized();

  if (isAdminRoute(method, pathname) && payload.role !== "ADMIN") {
    return forbidden();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};