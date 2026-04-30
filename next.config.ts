import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.45",
    "winter-epidemic-uniformly.ngrok-free.dev",
  ],
  reactStrictMode: true,
}

export default nextConfig
