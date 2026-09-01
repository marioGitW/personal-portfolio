"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResumeModal } from "@/components/ui/ResumeModal";
import { getSiteSettings } from "@/lib/content";

export function Hero() {
  const site = getSiteSettings();
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  return (
    <section
      id="home"
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-28 sm:px-6 lg:flex-row lg:items-center"
    >
      <div className="flex-1">
        <p className="hero-reveal font-heading text-xs tracking-[0.2em] text-slate-500 uppercase [animation-delay:60ms]">
          {site.role}
        </p>
        <h1 className="hero-reveal mt-4 uppercase [animation-delay:180ms]">
          <span className="text-accent-gradient">{site.name}</span>
        </h1>
        <p className="hero-reveal mt-4 max-w-xl text-lg text-slate-600 [animation-delay:300ms] dark:text-slate-400">
          {site.tagline}
        </p>
        <div className="hero-reveal mt-8 flex flex-wrap gap-3 [animation-delay:420ms]">
          <Button href="#contact">Let&apos;s Connect</Button>
          <Button
            ref={resumeButtonRef}
            variant="secondary"
            onClick={() => setResumeOpen(true)}
          >
            View Resume
          </Button>
        </div>
      </div>
      <div className="flex justify-center lg:w-[min(42vw,36rem)] lg:justify-end">
        <div className="hero-orbit-stage">
          <div className="hero-orbit-trail hero-orbit-trail-1" aria-hidden="true">
            <span className="hero-orbit-dot" />
          </div>
          <div className="hero-orbit-trail hero-orbit-trail-2" aria-hidden="true">
            <span className="hero-orbit-dot" />
          </div>
          <div className="hero-orbit-trail hero-orbit-trail-3" aria-hidden="true">
            <span className="hero-orbit-dot" />
          </div>
          <div className="hero-orbit-trail hero-orbit-trail-4" aria-hidden="true">
            <span className="hero-orbit-dot" />
          </div>
          <div className="hero-orbit-avatar">
            <Image
              src="/hero-img.png"
              alt={`${site.name} portrait`}
              fill
              priority
              sizes="(min-width: 1024px) 318px, (min-width: 640px) 265px, 212px"
              className="hero-image object-cover [animation-delay:500ms]"
            />
          </div>
        </div>
      </div>
      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        triggerRef={resumeButtonRef}
      />
    </section>
  );
}
