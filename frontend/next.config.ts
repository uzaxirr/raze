import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/pitch",
        destination: "/pitch/index.html",
      },
    ];
  },
};

export default nextConfig;
