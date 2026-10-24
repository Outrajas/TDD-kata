import type { NextConfig } from "next";

const apiOrigin = process.env.API_PROXY_ORIGIN?.replace(/\/$/, "");
const nextConfig: NextConfig = {
  async rewrites() {
    return apiOrigin ? [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }] : [];
  },
};

export default nextConfig;
