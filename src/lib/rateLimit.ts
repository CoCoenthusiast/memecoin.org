const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Attempt = {
  count: number;
  blockedUntil: number;
};

const g = globalThis as unknown as { __loginAttempts?: Map<string, Attempt> };
const attempts: Map<string, Attempt> = (g.__loginAttempts ??= new Map());

function makeKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}

export function isLoginBlocked(email: string, ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  const key = makeKey(email, ip);
  const entry = attempts.get(key);
  if (!entry) return { blocked: false, retryAfterMin: 0 };

  const now = Date.now();
  if (entry.blockedUntil === 0) {
    return { blocked: false, retryAfterMin: 0 };
  }

  if (now > entry.blockedUntil) {
    attempts.delete(key);
    return { blocked: false, retryAfterMin: 0 };
  }

  return {
    blocked: entry.count >= MAX_ATTEMPTS,
    retryAfterMin: Math.max(1, Math.ceil((entry.blockedUntil - now) / 60000)),
  };
}

export function recordFailedLogin(email: string, ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  const key = makeKey(email, ip);
  const now = Date.now();
  const entry = attempts.get(key) ?? { count: 0, blockedUntil: 0 };

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + WINDOW_MS;
  }
  attempts.set(key, entry);

  if (attempts.size > 10000) {
    for (const [k, v] of attempts) {
      if (now > v.blockedUntil) {
        attempts.delete(k);
      }
    }
  }

  return {
    blocked: entry.count >= MAX_ATTEMPTS,
    retryAfterMin: Math.max(1, Math.ceil((entry.blockedUntil - now) / 60000)),
  };
}

export function clearLoginAttempts(email: string, ip: string) {
  attempts.delete(makeKey(email, ip));
}
