"use client";

import Link from "next/link";
import { useEffect } from "react";

// Error boundaries must be client components. Kept free of CMS data and GSAP
// on purpose: this renders when something upstream has already failed.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="section-eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          This page failed to load
        </h1>
        <p className="mt-4 text-muted">Trying again usually resolves it.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-accent-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Try again
          </button>
          <Link
            href="/"
            className="surface-card inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition hover:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
