export const DELETE_WINDOW_MS = 30 * 60 * 1000;
export const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function isWithinWindow(createdAt: string | Date, windowMs: number): boolean {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= windowMs;
}
