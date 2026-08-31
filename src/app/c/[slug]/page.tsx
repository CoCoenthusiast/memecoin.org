import { Metadata } from "next"
import { prisma } from "@/lib/db"
import ChannelPageClient from "./ChannelPageClient"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const channel = await prisma.channel.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!channel) return { title: "Channel not found" }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://degenscult.vercel.app"

  return {
    title: `${channel.name} | degenscult`,
    description: channel.description,
    openGraph: {
      title: channel.name,
      description: channel.description,
      type: "website",
      url: `${siteUrl}/c/${slug}`,
      images: [{ url: `${siteUrl}/favicon.svg`, width: 64, height: 64 }],
    },
    twitter: {
      card: "summary",
      title: channel.name,
      description: channel.description,
      images: [`${siteUrl}/favicon.svg`],
    },
  }
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params
  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: {
      posts: {
        orderBy: [{ pinned: "desc" }, { lastActivityAt: "desc" }],
        take: 50,
        select: {
          id: true,
          title: true,
          body: true,
          imageUrl: true,
          createdAt: true,
          viewCount: true,
          pinned: true,
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { replies: true, reactions: true } },
        },
      },
    },
  })

  return <ChannelPageClient channel={channel} />
}
