export const DELETE_WINDOW_MS = 30 * 60 * 1000;
export const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function withinDeleteWindow(createdAt: string | Date): boolean {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= DELETE_WINDOW_MS;
}

export function withinEditWindow(createdAt: string | Date): boolean {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= EDIT_WINDOW_MS;
}
