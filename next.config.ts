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

const nextConfig: NextConfig = {
  // Enable gzip/brotli compression on all responses (off by default in some hosts).
  compress: true,
  // Prefer AVIF then WebP for next/image — dramatically smaller than JPEG/PNG.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Forward Cache-Control headers from the Django backend through the BFF proxy
  // to allow Cloudflare to cache read-only API responses at the edge.
  async headers() {
    return [
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
