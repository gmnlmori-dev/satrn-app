import type { NextConfig } from "next";

/** Header di sicurezza allineati a Stellr (deploy su Nginx + systemd). */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
] as const;

const noStoreHeader = {
  key: "Cache-Control",
  value: "private, no-store, max-age=0",
} as const;

const noStoreSources = ["/login", "/app/:path*"] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: [...securityHeaders] },
      ...noStoreSources.map((source) => ({
        source,
        headers: [noStoreHeader],
      })),
    ];
  },
};

export default nextConfig;
