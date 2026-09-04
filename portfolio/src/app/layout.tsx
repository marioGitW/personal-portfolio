import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Cursor } from "@/components/ui/Cursor";
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

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}`,
  description: site.tagline,
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
          <Cursor />
          <SocialSidebar links={socialLinks} />
          <SmoothScroll>{children}</SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
