"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Menu, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { navItems } from "@/lib/nav";
import { HudFrame } from "@/components/ui/hud-frame";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SocialLinkList } from "@/components/ui/SocialLinkList";
import type { SocialLinkItem } from "@/types/sanity";

const MENU_ID = "site-menu";
// How far the page is scrolled before the bar stops being transparent.
const SCROLLED_PX = 16;
// The slice of the viewport the active section is the one in.
const SPY_MARGIN = "-45% 0px -50% 0px";
// Where the bar's links take over from the menu. Tailwind's md.
const WIDE = "(min-width: 48rem)";
// After the page has loaded, in which the browser may still be putting the scroll back.
const SETTLE_MS = 300;

export function Header({
  name,
  socialLinks = [],
  variant = "home",
}: {
  name: string;
  socialLinks?: SocialLinkItem[];
  /**
   * "sub" is for routes that are not the one-page site (e.g. /projects/[slug]),
   * where the section anchors have to point back at the homepage.
   */
  variant?: "home" | "sub";
}) {
  const isHome = variant === "home";

  // Plain hrefs, not <Link>: off the homepage a full navigation lets the
  // browser resolve the hash itself, instead of racing Lenis and Next's scroll
  // restoration after a client transition. Still a real, crawlable link.
  const navHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const [activeId, setActiveId] = useState<string | null>(isHome ? navItems[0].sectionId : null);
  const [open, setOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  // Whether the indicator slides to where it goes next, or is just there.
  const slides = useRef(false);

  // Unlocked here and not only when the state has settled: a link in the menu closes it in the
  // same click that SmoothScroll scrolls from, and a locked page doesn't scroll.
  const closeMenu = useCallback(() => {
    unlockScroll();
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  useFocusTrap(open, headerRef, closeMenu);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Safari doesn't focus a button that is tapped, and the trap starts from it.
    toggleRef.current?.focus({ preventScroll: true });
    lockScroll();

    // Nothing to close it with once the bar has its own links.
    const wide = window.matchMedia(WIDE);
    wide.addEventListener("change", closeMenu);
    return () => {
      wide.removeEventListener("change", closeMenu);
      unlockScroll();
    };
  }, [open, closeMenu]);

  useEffect(() => {
    const update = () => {
      headerRef.current?.toggleAttribute("data-scrolled", window.scrollY >= SCROLLED_PX);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    // Two sections are in it at once as the line between them crosses it.
    const inSlice = new Set<string>();
    let current: string | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting) {
            inSlice.add(target.id);
            current = target.id;
          } else {
            inSlice.delete(target.id);
          }
        }
        // Scrolled back out of one that had only just come in, it is the other one's again. In
        // a part of the page that isn't in the nav, it stays with the last one that was.
        if (current && !inSlice.has(current)) {
          current = [...inSlice].at(-1) ?? current;
        }
        if (current) {
          setActiveId(current);
        }
      },
      { rootMargin: SPY_MARGIN },
    );

    for (const { sectionId } of navItems) {
      const section = document.getElementById(sectionId);
      if (section) {
        observer.observe(section);
      }
    }
    return () => observer.disconnect();
  }, [isHome]);

  const placeIndicator = useCallback((id: string | null, slide: boolean) => {
    const indicator = indicatorRef.current;
    const label = id ? linkRefs.current[id]?.querySelector("span") : null;
    const list = listRef.current;
    if (!indicator || !list || !label || label.offsetWidth === 0) {
      return;
    }
    const x = label.getBoundingClientRect().left - list.getBoundingClientRect().left;
    indicator.toggleAttribute("data-slides", slide);
    indicator.style.setProperty("--x", `${x}px`);
    indicator.style.setProperty("--w", `${label.offsetWidth}`);
  }, []);

  useLayoutEffect(() => {
    placeIndicator(activeId, slides.current);
  }, [activeId, placeIndicator]);

  // The list's size is what the viewport, the fonts and the breakpoint all show up in.
  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const observer = new ResizeObserver(() => placeIndicator(activeId, false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeId, placeIndicator]);

  // It has nowhere to slide from until the page has settled on where it is.
  useEffect(() => {
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        slides.current = true;
      }, SETTLE_MS);
    };
    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", arm);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      data-intro-chrome
      data-open={open ? "" : undefined}
      className="site-header sticky top-0 z-50 border-b border-transparent pt-[env(safe-area-inset-top,0px)] transition-colors duration-200"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <a
          href={isHome ? "#home" : "/"}
          aria-label={name}
          className="inline-flex h-11 shrink-0 items-center"
        >
          {/* No title: the link already carries aria-label={name}, and both
              would read the name twice. Inline SVG, so nothing is fetched and
              nothing competes with the hero image for LCP. */}
          <Logo className="h-8 w-16 text-foreground" />
        </a>

        <nav className="hidden md:block" aria-label="Primary">
          <ul ref={listRef} className="relative flex items-center">
            {navItems.map((item) => {
              const active = activeId === item.sectionId;
              return (
                <li key={item.sectionId}>
                  <a
                    ref={(node) => {
                      linkRefs.current[item.sectionId] = node;
                    }}
                    href={navHref(item.href)}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex h-11 items-center px-3 text-base font-medium transition-colors duration-200 lg:px-4 ${
                      active ? "text-foreground" : "text-muted pointer-fine:hover:text-foreground"
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
            {/* Wrapped, since a bare <span> is not valid as a child of <ul>. Only the
                homepage has a section to be under. */}
            {isHome && (
              <li aria-hidden="true">
                <span ref={indicatorRef} className="nav-indicator">
                  <span className="nav-indicator-node" />
                  <span className="nav-indicator-line" />
                  <svg className="nav-indicator-hook" width={10} height={10}>
                    <path d="M-1 9H1L9 1" />
                  </svg>
                </span>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <IconButton
            ref={toggleRef}
            className="md:hidden"
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? closeMenu() : setOpen(true))}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </IconButton>
        </div>
      </div>

      {/* Both are positioned in the header and not fixed: the blur on a jump between
          sections would make the page's wrapper what a fixed box is fixed to. */}
      <div aria-hidden="true" onClick={closeMenu} className="site-menu-backdrop md:hidden" />

      <HudFrame id={MENU_ID} size="md" className="site-menu md:hidden">
        <div
          data-lenis-prevent
          className="hud-clip max-h-[calc(100dvh-var(--header-height)-2px)] overflow-y-auto overscroll-contain"
        >
          <nav aria-label="Mobile" className="px-4 py-4 sm:px-6">
            <ul>
              {navItems.map((item, index) => {
                const active = activeId === item.sectionId;
                return (
                  <li
                    key={item.sectionId}
                    className="site-menu-item"
                    style={{ "--index": index } as CSSProperties}
                  >
                    <a
                      href={navHref(item.href)}
                      aria-current={active ? "true" : undefined}
                      onClick={closeMenu}
                      className={`flex min-h-12 items-center gap-4 border-l-2 px-4 font-heading text-lg font-semibold ${
                        active
                          ? "border-accent text-foreground"
                          : "border-transparent text-muted pointer-fine:hover:text-foreground"
                      }`}
                    >
                      <span aria-hidden="true" className="text-sm tabular-nums text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {socialLinks.length > 0 && (
            <div
              className="site-menu-item border-t border-border px-4 py-3 sm:px-6"
              style={{ "--index": navItems.length } as CSSProperties}
            >
              <SocialLinkList
                links={socialLinks}
                className="flex flex-wrap items-center gap-1"
                linkClassName="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-link focus-visible:text-link"
                iconClassName="size-5 shrink-0"
              />
            </div>
          )}
        </div>
      </HudFrame>
    </header>
  );
}
