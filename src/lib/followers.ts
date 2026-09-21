import { prisma } from "@/lib/db";

export function notifyFollowers(
  actor: { id: string; username: string },
  postId: string,
  title?: string
) {
  const preview = title ? title.slice(0, 120) : "a new post";
  prisma.follow
    .findMany({
      where: { followingId: actor.id },
      select: { followerId: true },
    })
    .then((follows) => {
      if (follows.length === 0) return;
      Promise.allSettled(
        follows.map((f) =>
          prisma.notification.create({
            data: {
              userId: f.followerId,
              actorId: actor.id,
              postId,
              message: `${actor.username} published: ${preview}`,
            },
          })
        )
      );
    })
    .catch((e) => console.error("Failed to create follower notifications", e));
}
