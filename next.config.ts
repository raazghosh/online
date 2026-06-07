import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false, // Don't expose "X-Powered-By: Next.js" header

  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination:
          process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
          "https://auth-service-production-25af.up.railway.app/:path*",
      },
      {
        source: "/api/vote/:path*",
        destination:
          process.env.NEXT_PUBLIC_VOTE_SERVICE_URL ||
          "https://vote-service-production.up.railway.app/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
