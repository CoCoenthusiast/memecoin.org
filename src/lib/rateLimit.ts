const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const MAX_REGISTRATIONS = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

type Attempt = {
  count: number;
  blockedUntil: number;
};

type Store = {
  __loginAttempts?: Map<string, Attempt>;
  __registerAttempts?: Map<string, Attempt>;
};

const g = globalThis as unknown as Store;
const attempts: Map<string, Attempt> = (g.__loginAttempts ??= new Map());
const registerAttempts: Map<string, Attempt> = (g.__registerAttempts ??= new Map());

function makeKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}

function isBlocked(
  map: Map<string, Attempt>,
  key: string,
  max: number
): { blocked: boolean; retryAfterMin: number } {
  const entry = map.get(key);
  if (!entry) return { blocked: false, retryAfterMin: 0 };

  const now = Date.now();
  if (entry.blockedUntil === 0) {
    return { blocked: false, retryAfterMin: 0 };
  }

  if (now > entry.blockedUntil) {
    map.delete(key);
    return { blocked: false, retryAfterMin: 0 };
  }

  return {
    blocked: entry.count >= max,
    retryAfterMin: Math.max(1, Math.ceil((entry.blockedUntil - now) / 60000)),
  };
}

function recordAttempt(
  map: Map<string, Attempt>,
  key: string,
  max: number,
  windowMs: number
): { blocked: boolean; retryAfterMin: number } {
  const now = Date.now();
  const entry = map.get(key) ?? { count: 0, blockedUntil: 0 };

  entry.count += 1;
  if (entry.count >= max) {
    entry.blockedUntil = now + windowMs;
  }
  map.set(key, entry);

  if (map.size > 10000) {
    for (const [k, v] of map) {
      if (now > v.blockedUntil) {
        map.delete(k);
      }
    }
  }

  return {
    blocked: entry.count >= max,
    retryAfterMin: Math.max(1, Math.ceil((entry.blockedUntil - now) / 60000)),
  };
}

export function isLoginBlocked(email: string, ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  return isBlocked(attempts, makeKey(email, ip), MAX_ATTEMPTS);
}

export function recordFailedLogin(email: string, ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  return recordAttempt(attempts, makeKey(email, ip), MAX_ATTEMPTS, WINDOW_MS);
}

export function clearLoginAttempts(email: string, ip: string) {
  attempts.delete(makeKey(email, ip));
}

export function isRegistrationBlocked(ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  return isBlocked(registerAttempts, `ip|${ip}`, MAX_REGISTRATIONS);
}

export function recordRegistration(ip: string): {
  blocked: boolean;
  retryAfterMin: number;
} {
  if (ip === "unknown") return { blocked: false, retryAfterMin: 0 };
  return recordAttempt(registerAttempts, `ip|${ip}`, MAX_REGISTRATIONS, REGISTER_WINDOW_MS);
}