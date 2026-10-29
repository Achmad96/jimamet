import type { NextConfig } from "next";

const backendOrigin = (
  process.env.DJANGO_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.68.113",
    "192.168.68.113:3000",
    "192.168.137.1",
    "192.168.137.1:3000",
    "192.168.20.144",
    "192.168.20.144:3000",
    "localhost:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/backend-api/detect-food",
        destination: `${backendOrigin}/api/detect-food/`,
      },
      {
        source: "/backend-api/detect-frame",
        destination: `${backendOrigin}/api/detect-frame/`,
      },
      {
        source: "/backend-api/detect-video",
        destination: `${backendOrigin}/api/detect-video/`,
      },
    ];
  },
};

export default nextConfig;
