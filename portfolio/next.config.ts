import type { NextConfig } from "next";

// No Content-Security-Policy here: Next's inline hydration scripts and GSAP's
// runtime style injection make a strict policy a real risk of shipping a blank
// page. Vercel adds HSTS for its own domains.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/devicons/devicon/**",
      },
      {
        // Sanity image assets. Icons are file assets (often SVG) and skip
        // next/image entirely — see `components/ui/AssetIcon`.
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
