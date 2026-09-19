import { Metadata } from "next"
import { prisma } from "@/lib/db"
import PostPageClient from "./PostPageClient"
import { isChannelIdAccessible } from "@/lib/vipChannel"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true, body: true, imageUrl: true, channelId: true, channel: { select: { name: true } } },
  })

  if (!post) return { title: "Post not found" }

  // Block VIP Lounge content from metadata for non-VIP users
  if (!(await isChannelIdAccessible(post.channelId))) {
    return { title: "Post not found" }
  }

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

  // Pre-check access before fetching full data
  const prePost = await prisma.post.findUnique({ where: { id }, select: { channelId: true } })
  if (!prePost || !(await isChannelIdAccessible(prePost.channelId))) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Post not found</h1>
          <p className="text-gray-400">This post may have been removed or is not available.</p>
        </div>
      </div>
    )
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true } },
      channel: { select: { id: true, slug: true, name: true } },
      replies: {
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, nameStyle: true, isVip: true, vipExpiresAt: true } },
          parent: { select: { id: true, body: true, author: { select: { username: true } } } },
          reactions: { select: { id: true, type: true, userId: true } },
        },
      },
      reactions: { select: { id: true, type: true, userId: true } },
    },
  })

  return <PostPageClient post={post} />
}
