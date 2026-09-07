export function isUserVip(user: {
  isVip?: boolean | null;
  vipExpiresAt?: Date | string | null;
}): boolean {
  if (!user.isVip) return false;
  // vipExpiresAt === null with isVip true → lifetime VIP (never expires)
  if (user.vipExpiresAt == null) return true;
  return new Date(user.vipExpiresAt).getTime() > Date.now();
}

export function isUserOwner(user: { isOwner?: boolean | null }): boolean {
  return !!user.isOwner;
}
