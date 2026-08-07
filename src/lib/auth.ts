import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  user: { id: string; username: string; email: string };
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, email: true },
  });
  if (!user) return null;

  return { user };
}

export async function requireAuth(): Promise<{
  user: { id: string; username: string; email: string };
}> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
