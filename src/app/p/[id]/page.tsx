import { Metadata } from "next"
import { prisma } from "@/lib/db"
import PostPageClient from "./PostPageClient"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true, body: true, imageUrl: true, channel: { select: { name: true } } },
  })

  if (!post) return { title: "Post not found" }

  const description = post.body.length > 160 ? post.body.slice(0, 157) + "..." : post.body
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://degenscult.vercel.app"

  return {
    title: `${post.title} | degenscult`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `${siteUrl}/p/${id}`,
      images: post.imageUrl ? [{ url: post.imageUrl, width: 1200, height: 630 }] : [{ url: `${siteUrl}/favicon.svg`, width: 64, height: 64 }],
    },
    twitter: {
      card: post.imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.imageUrl ? [post.imageUrl] : [`${siteUrl}/favicon.svg`],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      channel: { select: { id: true, slug: true, name: true } },
      replies: {
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          reactions: { select: { id: true, type: true, userId: true } },
        },
      },
      reactions: { select: { id: true, type: true, userId: true } },
    },
  })

  return <PostPageClient post={post} />
}
