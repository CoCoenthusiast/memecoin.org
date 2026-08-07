import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const channels = await prisma.channel.findMany({
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(channels);
}
