"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Logo } from "@/components/ui/Logo";
import { SocialLinkList } from "@/components/ui/SocialLinkList";
import { prefersReducedMotion, registerGsapPlugins } from "@/lib/animations";
import { getSiteSettings } from "@/lib/content";
import type { SocialLinkItem } from "@/types/sanity";

const iconLinkClass =
  "hud-hollow inline-flex size-11 items-center justify-center text-muted focus-visible:text-foreground lg:pointer-fine:size-10 pointer-fine:hover:text-foreground";

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
    if (targets.length === 0) {
      return;
    }
    const reducedMotion = prefersReducedMotion();

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
      className="border-t border-border px-4 pt-14 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:px-6"
    >
      <div ref={contentRef} className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div data-footer-item>
            <Logo title={site.name} className="h-9 w-18 text-foreground" />
            <p className="mt-3 max-w-sm text-sm text-muted">{site.tagline}</p>
          </div>

          {links.length > 0 && (
            <div data-footer-item>
              <SocialLinkList
                framed
                links={links}
                className="flex items-center gap-3"
                linkClassName={iconLinkClass}
                iconClassName="size-4.5 shrink-0"
              />
            </div>
          )}
        </div>

        <div
          data-footer-item
          className="flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="text-muted">Built with Next.js, GSAP &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
