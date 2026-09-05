import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Grotesk } from "next/font/google";
import { CursorSmoke } from "@/components/effects/CursorSmoke";
import { Preloader } from "@/components/ui/Preloader";
import { Providers } from "@/components/ui/Providers";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { SocialSidebar } from "@/components/ui/SocialSidebar";
import { getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";
import { shareImage } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
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

// Icons and the apple-touch icon come from the file conventions in this
// directory (icon.png, apple-icon.png, favicon.ico). The share card does not:
// see the note on shareImage in @/lib/seo.
export const metadata: Metadata = {
  // Absolute origin, required or Open Graph image URLs stay relative and the
  // scrapers ignore them. Resolved in @/lib/site so canonical, sitemap and
  // JSON-LD URLs cannot drift onto different domains.
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.role}`,
    // Sub-pages set a bare title; the name is appended here rather than in
    // every generateMetadata.
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: siteUrl }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  // Meta keywords carry no ranking weight; kept short and factual rather than
  // dropped, and never expanded into a keyword list.
  keywords: [
    site.name,
    "software engineer portfolio",
    "full-stack developer",
    "React",
    "Next.js",
    ".NET",
    "Spring Boot",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.description,
    locale: "en_US",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.description,
    images: [shareImage.url],
  },
};

// One value, not a light/dark pair: Providers pins the theme to dark with
// enableSystem={false}, so the browser chrome should match that.
export const viewport: Viewport = {
  themeColor: "#030712",
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
        {/* data-skip-link opts this out of the Lenis anchor handler: the native
            hash jump is what moves keyboard focus into <main>, and a smooth
            scroll would only move the viewport. */}
        <a
          href="#main"
          data-skip-link
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-background focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        >
          Skip to content
        </a>
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
        {/* Vercel Web Analytics. Sits outside Providers because it renders no
            markup — it only ships the page-view beacon, and is inert when the
            site is not served from Vercel. */}
        <Analytics />
      </body>
    </html>
  );
}
