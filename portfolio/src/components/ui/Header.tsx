"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import gsap from "gsap";
import { navItems } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header({ name }: { name: string }) {
  const [activeId, setActiveId] = useState<string>(navItems[0].sectionId);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const elements = navItems
      .map((item) => document.getElementById(item.sectionId))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const list = listRef.current;
    const activeLink = linkRefs.current[activeId];
    if (!indicator || !list || !activeLink) {
      return;
    }

    const listBox = list.getBoundingClientRect();
    const linkBox = activeLink.getBoundingClientRect();

    gsap.to(indicator, {
      x: linkBox.left - listBox.left,
      width: linkBox.width,
      duration: 0.35,
      ease: "power3.out",
    });
  }, [activeId]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const links = overlay.querySelectorAll("[data-mobile-link]");

    if (open) {
      overlay.removeAttribute("hidden");
      const timeline = gsap.timeline();
      timeline.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out" },
      );
      timeline.fromTo(
        links,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: "power3.out" },
        "<0.05",
      );
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-background/80 backdrop-blur-md dark:border-slate-800/80">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <a href="#home" className="font-heading text-sm font-semibold tracking-tight">
          {name}
        </a>

        <nav className="hidden md:block" aria-label="Primary">
          <ul ref={listRef} className="relative flex items-center gap-1 rounded-full p-1">
            <span
              ref={indicatorRef}
              className="bg-accent-gradient absolute top-1 bottom-1 left-0 rounded-full opacity-90"
            />
            {navItems.map((item) => (
              <li key={item.sectionId}>
                <a
                  ref={(node) => {
                    linkRefs.current[item.sectionId] = node;
                  }}
                  href={item.href}
                  className={`relative z-10 rounded-full px-4 py-2 text-base transition ${
                    activeId === item.sectionId
                      ? "font-semibold text-white shadow-sm shadow-indigo-500/40"
                      : "text-slate-500 hover:text-foreground dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-300 md:hidden dark:border-slate-700"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div
        ref={overlayRef}
        hidden={!open}
        className="fixed inset-0 z-40 bg-background/95 px-6 pt-24 md:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-4">
            {navItems.map((item) => (
              <li key={item.sectionId}>
                <a
                  data-mobile-link
                  href={item.href}
                  className="text-2xl font-semibold tracking-tight"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
