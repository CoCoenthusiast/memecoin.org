import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { isUserVip } from "@/lib/vip";

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const usernames: unknown = body?.usernames;
  if (!Array.isArray(usernames) || usernames.length === 0 || usernames.length > 100) {
    return apiError("Provide an array of usernames (up to 100)");
  }
  if (usernames.some((u) => typeof u !== "string")) {
    return apiError("Usernames must be strings");
  }

  const lower = [...new Set(usernames.map((u) => u.toLowerCase()))];
  const users = await prisma.user.findMany({
    where: { usernameLower: { in: lower } },
    select: {
      usernameLower: true,
      nameStyle: true,
      isVip: true,
      vipExpiresAt: true,
    },
  });

  const result: Record<string, { nameStyle: string | null; isVip: boolean }> = {};
  for (const u of users) {
    result[u.usernameLower] = {
      nameStyle: u.nameStyle,
      isVip: isUserVip(u),
    };
  }

  return NextResponse.json({ users: result });
});
