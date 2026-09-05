import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// script-src keeps 'unsafe-inline' because the Next.js App Router is only
// secure against it via per-request nonces: it injects inline scripts for the
// RSC flight payload ("self.__next_f.push(...)") and the hydration bootstrap
// ("<script id=\"_R_\">"). Nonces force every page to render dynamically,
// disabling static optimization/ISR/CDN caching (see the Next.js CSP guide in
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// style-src has no 'unsafe-inline' anymore: styles are served as external
// CSS files, and React's runtime `style` prop updates go through the CSSOM,
// which CSP does not block.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self'",
      "img-src 'self' https://*.supabase.co data: blob:",
      "media-src 'self' https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
