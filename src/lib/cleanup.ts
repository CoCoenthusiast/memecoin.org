import { PrismaClient } from "@/generated/db/client";

/**
 * Deletes unverified users and all their child records.
 * Safe against FK constraints — deletes in the correct order within a transaction.
 * Returns the number of users deleted.
 */
export async function cleanupUnverifiedUsers(
  prisma: PrismaClient,
  maxAgeMs: number
): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);

  const unverifiedUsers = await prisma.user.findMany({
    where: { emailVerified: false, createdAt: { lt: cutoff } },
    select: { id: true },
  });

  if (unverifiedUsers.length === 0) return 0;

  const userIds = unverifiedUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    // 1. ProfileComments authored by or targeting these users (has reactions + notifications children)
    const profileComments = await tx.profileComment.findMany({
      where: { OR: [{ authorId: { in: userIds } }, { profileUserId: { in: userIds } }] },
      select: { id: true },
    });
    const pcIds = profileComments.map((pc) => pc.id);
    if (pcIds.length > 0) {
      await tx.reaction.deleteMany({ where: { profileCommentId: { in: pcIds } } });
      await tx.notification.deleteMany({ where: { profileCommentId: { in: pcIds } } });
      await tx.profileComment.deleteMany({ where: { id: { in: pcIds } } });
    }

    // 2. Replies by these users (must be before posts — Reply references Post)
    await tx.reply.deleteMany({ where: { authorId: { in: userIds } } });

    // 3. Posts by these users (cascades: notifications, bookmarks)
    await tx.post.deleteMany({ where: { authorId: { in: userIds } } });

    // 4. Remaining direct children
    await tx.loginLog.deleteMany({ where: { userId: { in: userIds } } });
    await tx.reaction.deleteMany({ where: { userId: { in: userIds } } });
    await tx.report.deleteMany({
      where: { OR: [{ reporterId: { in: userIds } }, { reportedUserId: { in: userIds } }] },
    });

    // 5. Finally delete the users
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });

  return userIds.length;
}
