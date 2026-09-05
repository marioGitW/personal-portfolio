import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { CursorSmoke } from "@/components/effects/CursorSmoke";
import { Preloader } from "@/components/ui/Preloader";
import { Providers } from "@/components/ui/Providers";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { SocialSidebar } from "@/components/ui/SocialSidebar";
import { getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const site = getSiteSettings();

// Absolute origin, required or Open Graph image URLs stay relative and the
// scrapers ignore them. Vercel injects VERCEL_PROJECT_PRODUCTION_URL itself.
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

// The share card, icons and apple-touch icon come from the file conventions in
// this directory (opengraph-image.png, twitter-image.png, icon.png,
// apple-icon.png); Next emits the tags, including the dimensions Facebook wants.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.name,
  description: site.tagline,
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.name,
    description: site.tagline,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.tagline,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // cache()'d, so this shares the page's CMS round trip rather than adding one.
  const socialLinks = await getSocialLinks();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <Preloader />
          {/* The custom cursor (@/components/ui/Cursor) is intentionally not
              mounted: replacing the native cursor meant every browser-owned
              surface — scrollbars, media controls, embedded frames — needed its
              own opt-out. The component and its CSS are kept so it can be
              dropped back in here, but CursorSmoke is what ships. */}
          <CursorSmoke />
          <SocialSidebar links={socialLinks} />
          <SmoothScroll>{children}</SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
