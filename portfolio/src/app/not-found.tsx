import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";

// Next serves this with a real 404 status, so crawlers drop the URL on their
// own; noindex is belt and braces for anything that renders it regardless.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const site = getSiteSettings();
  const socialLinks = await getSocialLinks();

  return (
    <>
      <Header name={site.name} socialLinks={socialLinks} variant="sub" />
      <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="mx-auto w-full max-w-lg text-center">
          <p className="section-eyebrow">404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            This page does not exist
          </h1>
          <p className="mt-4 text-muted">
            The link may be out of date, or the project may have been renamed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Back to home
            </Link>
            <Link
              href="/#projects"
              className="surface-card inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition hover:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              View projects
            </Link>
          </div>
        </div>
      </main>
      <Footer links={socialLinks} />
    </>
  );
}
