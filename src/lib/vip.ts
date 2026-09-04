export function isUserVip(user: {
  isVip?: boolean | null;
  vipExpiresAt?: Date | string | null;
}): boolean {
  if (!user.isVip) return false;
  if (!user.vipExpiresAt) return false;
  return new Date(user.vipExpiresAt).getTime() > Date.now();
}
