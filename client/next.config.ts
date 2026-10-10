import type { NextConfig } from "next";

const apiOrigin = process.env["API_ORIGIN"];

if (!apiOrigin) {
  throw new Error(
    "API_ORIGIN is not set. Copy client/.env.example to client/.env.local and fill it in.",
  );
}

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
