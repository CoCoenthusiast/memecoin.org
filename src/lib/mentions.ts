import { prisma } from "@/lib/db";

function uniqueLowerNames(text: string | null | undefined): string[] {
  if (!text) return [];
  const set = new Set<string>();
  for (const m of text.matchAll(/@([A-Za-z0-9_]+)/g)) {
    set.add(m[1].toLowerCase());
  }
  return [...set];
}

export function notifyMentions(
  text: string | null | undefined,
  actor: { id: string; username: string },
  postId: string,
  kind: "post" | "comment"
) {
  const names = uniqueLowerNames(text);
  if (names.length === 0) return;

  prisma.user
    .findMany({
      where: { usernameLower: { in: names } },
      select: { id: true },
    })
    .then((users) => {
      Promise.allSettled(
        users
          .filter((u) => u.id !== actor.id)
          .map((u) =>
            prisma.notification.create({
              data: {
                userId: u.id,
                actorId: actor.id,
                postId,
                message: `${actor.username} mentioned you in a ${kind}`,
              },
            })
          )
      );
    })
    // Intentional: fire-and-forget. Menções são secundárias —
    // o post/reply com menção foi criado e retornado ao cliente normalmente,
    // independentemente de a notificação falhar.
    .catch((e) => console.error("Failed to create mention notifications", e));
}
