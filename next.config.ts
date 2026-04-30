import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
}

module.exports = {
  allowedDevOrigins: [
    "192.168.0.45",
    "winter-epidemic-uniformly.ngrok-free.dev",
  ],
}

export default nextConfig
