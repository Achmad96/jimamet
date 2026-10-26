import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.68.113",
    "192.168.68.113:3000",
    "192.168.137.1",
    "192.168.137.1:3000",
    "localhost:3000",
  ],
};

export default nextConfig;
