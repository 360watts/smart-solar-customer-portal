import type { NextConfig } from "next";

if (!process.env.API_BASE_URL) {
  throw new Error(
    "API_BASE_URL is required but not set. " +
    "Add it to .env.local (local dev) or your deployment environment.",
  );
}

if (!process.env.EMPLOYEE_APP_URL) {
  console.warn(
    "[360watts] EMPLOYEE_APP_URL is not set. " +
    "Employees who log in to the customer portal will not receive a redirect link to the staff app.",
  );
}

// Security headers applied to every response. Fonts are self-hosted via
// next/font (no external font CDN at runtime), and there are no third-party
// scripts/analytics in this app, so the CSP can stay close to 'self'.
//
// 'unsafe-inline' is required on BOTH script-src and style-src: Next.js's App
// Router injects inline bootstrap/hydration scripts (RSC payload via
// `self.__next_r`) on every page load, and a strict `script-src 'self'`
// without it breaks hydration outright (verified: without 'unsafe-inline',
// every route throws "Invariant: Expected a request ID to be defined for the
// document via self.__next_r" and the app fails to render). The correct
// tightened version is a per-request nonce threaded through middleware (see
// https://nextjs.org/docs/app/guides/content-security-policy) — that touches
// src/proxy.ts's auth logic significantly and isn't done here. This CSP is
// still a real improvement: it blocks all cross-origin script/object/frame
// injection, restricts fetch/image/font/connect origins to 'self', and sets
// frame-ancestors 'none' against clickjacking — it just doesn't stop inline
// script execution from a successful injection. Track nonce-based tightening
// as a follow-up, not a substitute for output-encoding XSS defenses.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is dev-only: React's dev bundle uses eval() to
      // reconstruct stack traces for debugging (never in production) — a
      // strict script-src in dev mode logs a harmless-but-noisy console
      // error for it, so it's scoped out of the production policy.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Enable gzip/brotli compression on all responses (off by default in some hosts).
  compress: true,
  // Don't advertise the framework in responses — a small reduction in
  // fingerprinting surface for automated vulnerability scanners.
  poweredByHeader: false,
  // Prefer AVIF then WebP for next/image — dramatically smaller than JPEG/PNG.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Forward Cache-Control headers from the Django backend through the BFF proxy
  // to allow Cloudflare to cache read-only API responses at the edge.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/api/backend/sites/:siteId/forecast/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=900, stale-while-revalidate=60" }],
      },
      {
        source: "/api/backend/sites/:siteId/energy-summary/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=180, stale-while-revalidate=30" }],
      },
    ];
  },
};

export default nextConfig;
