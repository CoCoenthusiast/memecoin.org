export const DELETE_WINDOW_MS = 30 * 60 * 1000;

export function withinDeleteWindow(createdAt: string | Date): boolean {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= DELETE_WINDOW_MS;
}
