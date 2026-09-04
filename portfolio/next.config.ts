import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/devicons/devicon/**",
      },
      {
        // Sanity image assets: project thumbnails and screenshots.
        // Icons are file assets (often SVG) and bypass next/image entirely —
        // see `components/ui/AssetIcon`.
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
