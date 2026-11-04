import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content";

// Served at /manifest.webmanifest and linked from every page by Next. Gives
// Android and desktop Chrome the home-screen and install icons. The colours
// match the dark theme, which is the default (see viewport in layout.tsx).
export default function manifest(): MetadataRoute.Manifest {
  const site = getSiteSettings();

  return {
    name: `${site.name} - ${site.role}`,
    short_name: "Mario S.",
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#061D3A",
    theme_color: "#061D3A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        // Full-bleed with the mark inside the safe zone, for launchers that
        // crop icons to a circle or squircle.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
