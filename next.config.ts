import type { NextConfig } from "next";

const appOrigins = (process.env.APP_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: appOrigins,
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
