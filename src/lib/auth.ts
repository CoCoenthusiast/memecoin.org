import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
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

export function signToken(payload: { userId: string; role: string }): string {
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
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
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
    select: { id: true, username: true, email: true, role: true },
  });
  if (!user) return null;

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
