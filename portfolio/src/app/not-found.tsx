import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-24 outline-none"
      >
        <div className="mx-auto w-full max-w-lg text-center">
          <p className="section-eyebrow">404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            This page does not exist
          </h1>
          <p className="mt-4 text-muted">
            The link may be out of date, or the project may have been renamed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={Link} href="/" className="font-semibold">
              Back to home
            </Button>
            <Button
              as={Link}
              href="/#projects"
              variant="secondary"
              className="font-semibold [--hud-fill:var(--surface)]"
            >
              View projects
            </Button>
          </div>
        </div>
      </main>
      <Footer links={socialLinks} />
    </>
  );
}
