import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.45",
    "winter-epidemic-uniformly.ngrok-free.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  reactStrictMode: true,
}

export default nextConfig
