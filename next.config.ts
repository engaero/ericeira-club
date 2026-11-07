import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Capas de categoria (Unsplash). Avatares de prestadores são URLs arbitrários e continuam em <img>.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
