import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  async rewrites() {
    const apiOrigin = process.env.TASKFLOW_API_ORIGIN;

    if (!apiOrigin) {
      if (process.env.NODE_ENV === "development") {
        return [];
      }

      throw new Error("TASKFLOW_API_ORIGIN must be configured for production");
    }

    let parsedOrigin: URL;

    try {
      parsedOrigin = new URL(apiOrigin);
    } catch {
      throw new Error("TASKFLOW_API_ORIGIN must be a valid HTTP(S) origin");
    }

    if (
      !["http:", "https:"].includes(parsedOrigin.protocol) ||
      parsedOrigin.pathname !== "/" ||
      parsedOrigin.search ||
      parsedOrigin.hash ||
      parsedOrigin.username ||
      parsedOrigin.password
    ) {
      throw new Error("TASKFLOW_API_ORIGIN must be a valid HTTP(S) origin");
    }

    return [
      {
        source: "/api/:path*",
        destination: `${parsedOrigin.origin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
