import { MetadataRoute } from "next"
import { prisma } from "@/lib/db"
import { VIP_CHANNEL_SLUG } from "@/lib/constants"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://degenscult.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vipChannel = await prisma.channel.findUnique({
    where: { slug: VIP_CHANNEL_SLUG },
    select: { id: true },
  });

  const [channels, posts] = await Promise.all([
    prisma.channel.findMany({
      where: vipChannel ? { id: { not: vipChannel.id } } : undefined,
      select: { slug: true },
    }),
    prisma.post.findMany({
      where: vipChannel ? { channelId: { not: vipChannel.id } } : undefined,
      select: { id: true, updatedAt: true },
    }),
  ])

  const channelEntries: MetadataRoute.Sitemap = channels.map((ch) => ({
    url: `${SITE_URL}/c/${ch.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/p/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...channelEntries,
    ...postEntries,
  ]
}
