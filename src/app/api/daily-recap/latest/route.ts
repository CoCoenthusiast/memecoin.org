import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";

export const revalidate = 60;

export const GET = withErrorHandling(async function GET() {
  const recap = await prisma.dailyRecap.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  if (!recap) {
    return NextResponse.json({ recap: null });
  }

  return NextResponse.json({ recap });
});
