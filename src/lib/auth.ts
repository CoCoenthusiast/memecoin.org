import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isVip: boolean;
  vipExpiresAt: Date | null;
};

export function isAdmin(user: { role: string }): boolean {
  return user.role === "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: {
  userId: string;
  role: string;
  tokenVersion: number;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax" as const,
    maxAge,
  };
}

export function verifyToken(token: string): {
  userId: string;
  role: string;
  tokenVersion: number;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      tokenVersion: number;
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  user: AuthUser;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isVip: true,
      vipExpiresAt: true,
      tokenVersion: true,
    },
  });
  if (!user) return null;

  // Reject sessions whose token was issued before the user's last
  // tokenVersion bump (e.g. admin "force logout" increments it).
  if (user.tokenVersion !== payload.tokenVersion) return null;

  return { user };
}

export async function requireAuth(): Promise<{
  user: AuthUser;
}> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<{
  user: AuthUser;
}> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user)) redirect("/");
  return session;
}
