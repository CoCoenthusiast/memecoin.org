import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { isUserVip } from "@/lib/vip";

const HEX_RE = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/;
const ANIMATIONS = ["static", "shift", "pulse"] as const;

function isValidStyle(value: unknown): value is {
  colors: string[];
  animation: (typeof ANIMATIONS)[number];
  speed: string;
  glow: boolean;
} {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.colors) || s.colors.length !== 2) return false;
  if (s.colors.some((c) => typeof c !== "string" || !HEX_RE.test(c))) return false;
  if (typeof s.animation !== "string" || !(ANIMATIONS as readonly string[]).includes(s.animation)) {
    return false;
  }
  if (s.speed !== undefined && typeof s.speed !== "string") return false;
  if (s.glow !== undefined && typeof s.glow !== "boolean") return false;
  return true;
}

type StyleShape = { colors: string[]; animation: string; glow: boolean };

function styleShape(value: unknown): StyleShape | null {
  if (!isValidStyle(value)) return null;
  const s = value as Record<string, unknown>;
  return {
    colors: s.colors as string[],
    animation: s.animation as string,
    glow: s.glow as boolean,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb);
}

function isTooSimilar(a: StyleShape, b: StyleShape): boolean {
  if (a.animation !== b.animation || a.glow !== b.glow) return false;
  const combined =
    colorDistance(a.colors[0], b.colors[0]) + colorDistance(a.colors[1], b.colors[1]);
  return combined < 60;
}

export const PATCH = withErrorHandling(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { user } = await requireAuth();
  const { username } = await params;
  const usernameLower = username.toLowerCase();

  const profile = await prisma.user.findUnique({
    where: { usernameLower },
    select: { id: true },
  });
  if (!profile) {
    return apiError("User not found", 404);
  }
  if (profile.id !== user.id) {
    return apiError("Forbidden", 403);
  }
  if (!isUserVip(user)) {
    return apiError("VIP is required to customize your name", 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.nameStyle !== "string") {
    return apiError("nameStyle must be a JSON string");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.nameStyle);
  } catch {
    return apiError("nameStyle is not valid JSON");
  }

  if (!isValidStyle(parsed)) {
    return apiError("Invalid name style. Expected colors (2 hex), animation (static|shift|pulse), glow (boolean)");
  }

  const newStyle = styleShape(parsed)!;
  const others = await prisma.user.findMany({
    where: { nameStyle: { not: null }, NOT: { id: profile.id } },
    select: { nameStyle: true },
  });

  for (const other of others) {
    if (!other.nameStyle) continue;
    let otherParsed: unknown;
    try {
      otherParsed = JSON.parse(other.nameStyle);
    } catch {
      continue;
    }
    const otherStyle = styleShape(otherParsed);
    if (otherStyle && isTooSimilar(newStyle, otherStyle)) {
      return apiError(
        "This style is too similar to another user's. Please choose different colors or effects.",
        400
      );
    }
  }

  await prisma.user.update({
    where: { id: profile.id },
    data: { nameStyle: body.nameStyle },
  });

  return NextResponse.json({ nameStyle: body.nameStyle });
});
