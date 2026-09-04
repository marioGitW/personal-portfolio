"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { SocialIcon, socialLabel } from "@/components/ui/SocialIcons";
import { registerGsapPlugins } from "@/lib/animations";
import { getSiteSettings } from "@/lib/content";
import { isExternalHref, socialHref } from "@/lib/format";
import type { SocialLinkItem } from "@/types/sanity";

const iconLinkClass =
  "group inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:border-[color:var(--color-accent-from)] hover:text-[color:var(--color-accent-from)] focus-visible:-translate-y-0.5 focus-visible:border-[color:var(--color-accent-from)] focus-visible:text-[color:var(--color-accent-from)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-slate-800";

type FooterProps = {
  links: SocialLinkItem[];
};

export function Footer({ links }: FooterProps) {
  const site = getSiteSettings();
  const year = new Date().getFullYear();

  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) {
      return;
    }

    const targets = content.querySelectorAll<HTMLElement>("[data-footer-item]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    registerGsapPlugins();

    gsap.set(targets, { opacity: 0, y: 16 });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: {
        trigger: section,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <footer
      ref={sectionRef}
      className="border-t border-slate-200 px-4 py-14 sm:px-6 dark:border-slate-800"
    >
      <div ref={contentRef} className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div data-footer-item>
            <Image
              src="/ms-logo.svg"
              alt={site.name}
              width={220}
              height={152}
              className="h-9 w-auto"
            />
            <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {site.tagline}
            </p>
          </div>

          {links.length > 0 && (
            <ul data-footer-item className="flex items-center gap-3">
              {links.map((link) => {
                const href = socialHref(link);
                if (!href) {
                  return null;
                }

                const label = socialLabel(link);
                const external = isExternalHref(href);

                return (
                  <li key={link._key}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      aria-label={label}
                      title={label}
                      className={iconLinkClass}
                    >
                      <SocialIcon
                        link={link}
                        className="size-4.5 shrink-0 transition-[filter] duration-[250ms] ease-out group-hover:drop-shadow-[0_0_6px_var(--color-accent-from)]"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          data-footer-item
          className="flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400"
        >
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="text-slate-400 dark:text-slate-500">Built with Next.js, GSAP &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
