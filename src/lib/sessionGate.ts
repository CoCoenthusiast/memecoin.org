"use client"

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou, faça login novamente"

// Detects an invalid/expired session coming back from a mutation API call.
// Expired sessions make requireAuth() emit a server-side redirect to /login
// (fetch would follow it silently), so mutation calls should use
// `{ redirect: "manual" }` and treat `opaqueredirect` like a 401.
export function isSessionExpired(res: Response): boolean {
  return res.type === "opaqueredirect" || res.status === 401
}