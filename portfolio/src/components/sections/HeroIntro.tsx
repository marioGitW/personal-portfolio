"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import type { ParticlePortraitHandle } from "@/components/sections/ParticlePortrait";
import { markIntroPlayed } from "@/lib/intro";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, Flip, SplitText);
}

// Every duration and easing of the intro. Times are seconds, and each "at" is an
// offset from the start of its phase. Particle timing lives in ParticlePortrait.
const INTRO = {
  word: "PORTFOLIO",
  // Phase A: the wait for assets, before the timeline below starts.
  wait: { minMs: 400, maxMs: 2500 },
  breathe: { scaleX: 1.3, scaleY: 0.62, duration: 0.8, ease: "sine.inOut" },
  // Where each phase starts on the master timeline.
  phases: { bang: 0, letters: 0.4, swap: 1.2, handoff: 1.8, reveal: 2.2 },
  // Sizes relative to the hero name's font size, clamped for small screens.
  size: { dotBase: 14, ballPerFont: 0.11, ballMin: 11, ballMax: 26, barPerBall: 0.85 },
  // The word sits slightly small in the centre and grows into the hero line.
  wordScale: 0.86,
  bang: {
    anticipate: { at: 0, duration: 0.07, ease: "power2.out", scaleX: 1.7, scaleY: 0.4 },
    travel: { at: 0.07, duration: 0.3, ease: "none" },
    rise: { at: 0.07, duration: 0.16, ease: "power2.out", scaleX: 0.8, scaleY: 1.25 },
    fall: { at: 0.23, duration: 0.14, ease: "power2.in" },
    land: { at: 0.37, duration: 0.03, ease: "none", scaleX: 1.35, scaleY: 0.7 },
    settle: { at: 0.4, duration: 0.14, ease: "back.out(3)" },
    bar: { at: 0.26, duration: 0.14, ease: "back.out(2)" },
    hopPerCapHeight: 0.9,
  },
  letters: {
    from: { rotation: -90, rotationX: 28 },
    flip: { at: 0.02, duration: 0.4, stagger: 0.05, ease: "back.out(1.6)" },
    appear: { at: 0.02, duration: 0.08, stagger: 0.05, ease: "none" },
    perspective: 600,
    barTip: { at: 0, duration: 0.24, ease: "power2.in" },
    barStretch: { at: 0.24, duration: 0.26, ease: "power2.out" },
    barRetract: { at: 0.5, duration: 0.3, ease: "power1.in" },
    roll: { at: 0.16, duration: 0.64, ease: "power1.inOut" },
  },
  swap: {
    stagger: 0.04,
    flipOut: { duration: 0.13, ease: "power2.in" },
    flipIn: { duration: 0.13, ease: "power2.out" },
    // Both words' letter positions are known up front, so the change of widths is
    // one glide of every slot rather than a run of reflows.
    reflow: { at: 0, duration: 0.58, ease: "sine.inOut" },
  },
  handoff: {
    word: { at: 0, duration: 0.5, ease: "power3.inOut" },
    // Fill goes from the metallic gradient to line two's own solid colour.
    fill: { at: 0, duration: 0.5, ease: "power1.inOut" },
    lineOne: { at: 0.1, duration: 0.6, ease: "power4.out" },
    dot: { at: 0, duration: 0.55, ease: "power3.inOut", arcPerViewport: 0.18 },
    eyebrowText: { at: 0.25, duration: 0.4, ease: "power3.out", y: 16 },
    spotlight: { at: 0, duration: 0.6, ease: "power3.inOut", sizePerPortrait: 1.15 },
    spotlightFade: { at: 0.25, duration: 0.5, ease: "power1.in" },
    backdrop: { at: 0, duration: 0.6, ease: "power1.inOut" },
  },
  reveal: {
    copy: { at: 0, y: 16, duration: 0.5, stagger: 0.06, ease: "power3.out" },
    // Without particles (touch, narrow screens) the portrait simply fades in.
    portraitFade: { at: 0, duration: 0.6, ease: "power1.out" },
  },
} as const;

const SKIP_EVENTS = ["click", "keydown", "wheel", "touchstart"] as const;

type HeroIntroProps = {
  particlesRef: RefObject<ParticlePortraitHandle | null>;
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function HeroIntro({ particlesRef }: HeroIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (context, contextSafe) => {
      const failsafe = window.__introFailsafe;
      if (!failsafe) {
        return;
      }
      window.clearTimeout(failsafe);

      const html = document.documentElement;
      // React's dev-only Strict Mode remount strips the attribute off <html>. A
      // no-op in production, where the head script's value is still there.
      html.setAttribute("data-intro", "pending");

      const root = rootRef.current;
      const floor = floorRef.current;
      const backdrop = backdropRef.current;
      const spotlight = spotlightRef.current;
      const landing = landingRef.current;
      const word = wordRef.current;
      const bar = barRef.current;
      const dot = dotRef.current;

      // Looked up rather than passed down as refs: this runs before React attaches
      // refs to the hero elements that follow it in the tree, but the nodes exist.
      const section = root?.closest("section");
      const part = (name: string) =>
        section?.querySelector<HTMLElement>(`[data-intro-hide="${name}"]`) ?? null;
      const eyebrowDot = part("eyebrow-dot");
      const eyebrowText = part("eyebrow-text");
      const lineOne = part("line-one");
      const lineTwo = part("line-two");
      const tagline = part("tagline");
      const cta = part("cta");
      const portrait = section?.querySelector<HTMLImageElement>("[data-intro-portrait]") ?? null;

      let timeline: gsap.core.Timeline | null = null;
      let finished = false;
      let unmounted = false;
      let revertFrame = 0;

      const removeListeners = () => {
        SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip, true));
        window.removeEventListener("resize", handleResize);
      };

      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        window.__introFailsafe = 0;
        removeListeners();
        markIntroPlayed();
        unlockScroll();
        // The attribute first, so the CSS hide never outlives GSAP's inline values.
        // Everything is at its final value by now and the revert only takes those
        // inline styles away. That is not just tidiness: a transform left on the
        // header would become the containing block for its fixed mobile menu.
        html.setAttribute("data-intro", "done");
        revertFrame = window.requestAnimationFrame(() => {
          context.revert();
          // SplitText's revert puts the intro word back.
          wordRef.current?.replaceChildren();
        });
      };

      const skip = () => {
        if (timeline) {
          timeline.progress(1);
        } else {
          finish();
        }
      };

      // The landing spots were measured for this width, so don't play on past it.
      const startWidth = window.innerWidth;
      const handleResize = () => {
        if (window.innerWidth !== startWidth) {
          skip();
        }
      };

      if (
        !root ||
        !floor ||
        !backdrop ||
        !spotlight ||
        !landing ||
        !word ||
        !bar ||
        !dot ||
        !eyebrowDot ||
        !eyebrowText ||
        !lineOne ||
        !lineTwo ||
        !tagline ||
        !cta ||
        !portrait
      ) {
        finish();
        return;
      }

      SKIP_EVENTS.forEach((type) =>
        window.addEventListener(type, skip, { capture: true, passive: true }),
      );
      window.addEventListener("resize", handleResize);
      lockScroll();

      // The dot's resting ellipse is in the stylesheet, so it is already on screen
      // before this runs.
      const { breathe } = INTRO;
      const breathing = gsap.to(dot, {
        scaleX: breathe.scaleX,
        scaleY: breathe.scaleY,
        duration: breathe.duration,
        ease: breathe.ease,
        repeat: -1,
        yoyo: true,
      });

      const buildTimeline = () => {
        // A one-word title has no second line to land on.
        const lineTwoText = lineTwo.firstChild;
        if (!(lineTwoText instanceof Text)) {
          return null;
        }

        const range = document.createRange();
        const boundsOf = (node: Text, start = 0, end = node.length) => {
          range.setStart(node, start);
          range.setEnd(node, end);
          return range.getBoundingClientRect();
        };
        const lettersOf = (node: Text, origin: number) =>
          Array.from(
            { length: node.length },
            (_, index) => boundsOf(node, index, index + 1).left - origin,
          );

        // Line two's text box and its kerned letter positions. A split word loses
        // kerning, and the "PA" and "OV" pairs would visibly jump at the swap, so
        // the letters are placed from these rather than left to flow.
        const lineBox = boundsOf(lineTwoText);
        const lineStyles = getComputedStyle(lineTwo);
        const fontSize = parseFloat(lineStyles.fontSize);
        const toWord = lineTwoText.data.toUpperCase();
        const toLefts = lettersOf(lineTwoText, lineBox.left);

        // autoRound off here and on the landing box: GSAP snaps px values to whole
        // pixels by default, and a 58.5px font rendered at 59px lands visibly wrong.
        gsap.set(word, {
          autoRound: false,
          width: lineBox.width,
          height: lineBox.height,
          fontSize,
          letterSpacing: lineStyles.letterSpacing,
          lineHeight: `${lineBox.height}px`,
        });

        word.textContent = INTRO.word;
        const introText = word.firstChild as Text;
        const introBox = boundsOf(introText);
        const inset = (lineBox.width - introBox.width) / 2;
        const fromLefts = lettersOf(introText, introBox.left).map((left) => left + inset);

        // One slot per letter of the longer word, in case the CMS title changes.
        word.textContent = INTRO.word.length >= toWord.length ? INTRO.word : toWord;
        const chars = SplitText.create(word, {
          type: "chars",
          tag: "span",
          aria: "none",
          charsClass: "hero-intro-char",
        }).chars as HTMLElement[];
        chars.forEach((char, index) => {
          char.textContent = INTRO.word[index] ?? "";
        });

        const measuring = document.createElement("canvas").getContext("2d");
        if (!measuring) {
          return null;
        }
        measuring.font = `${lineStyles.fontWeight} ${lineStyles.fontSize} ${lineStyles.fontFamily}`;
        const metrics = measuring.measureText("H");
        const ascent = metrics.fontBoundingBoxAscent;
        const capHeight = metrics.actualBoundingBoxAscent;

        const viewportWidth = root.clientWidth;
        const viewportHeight = root.clientHeight;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const { wordScale, size } = INTRO;

        // The caps, rather than the taller line box, are what sit dead centre.
        const baselineY = centerY + (capHeight / 2) * wordScale;
        const wordY =
          centerY - lineBox.height / 2 - (ascent - capHeight / 2 - lineBox.height / 2) * wordScale;
        const screenX = (localX: number) => centerX + (localX - lineBox.width / 2) * wordScale;

        gsap.set(word, { x: centerX - lineBox.width / 2, y: wordY, scale: wordScale });
        gsap.set(landing, {
          autoRound: false,
          x: lineBox.left,
          y: lineBox.top,
          width: lineBox.width,
          height: lineBox.height,
        });
        gsap.set(chars, {
          position: "absolute",
          left: 0,
          top: 0,
          x: (index: number) => fromLefts[index] ?? lineBox.width,
          opacity: 0,
          rotation: INTRO.letters.from.rotation,
          rotationX: INTRO.letters.from.rotationX,
          transformOrigin: "left bottom",
          transformPerspective: INTRO.letters.perspective,
        });

        // The "!": a ball on the word's left edge with the bar standing over it.
        const ball = clamp(fontSize * size.ballPerFont, size.ballMin, size.ballMax);
        const ballScale = ball / size.dotBase;
        const barWidth = ball * size.barPerBall;
        const barHeight = capHeight * wordScale;
        const wordLeft = screenX(fromLefts[0] ?? 0);
        const wordRight = screenX(inset + introBox.width);
        const finalRight = screenX(lineBox.width);
        const pivotX = wordLeft + barWidth / 2;
        // Far enough down that the bar, once fallen, clears the letters' feet and
        // the ball can roll beneath it.
        const pivotY = baselineY + barWidth / 2 + 3;
        const ballY = pivotY + barWidth / 2 + 2 + ball / 2;
        const barLength = wordRight - pivotX;

        gsap.set(bar, {
          width: barWidth,
          height: barHeight,
          x: pivotX - barWidth / 2,
          y: pivotY - barHeight,
          scaleY: 0,
          transformOrigin: "50% 100%",
        });

        // The dot's stylesheet position is the viewport centre, so x/y are offsets.
        const restY = ballY - centerY;
        const landX = pivotX - centerX;
        const rollEndX = wordRight + ball - centerX;
        const finalRestX = finalRight + ball - centerX;

        const { phases, bang, letters, swap, handoff, reveal } = INTRO;
        const tl = gsap.timeline({ onComplete: finish });
        (Object.keys(phases) as (keyof typeof phases)[]).forEach((label) =>
          tl.addLabel(label, phases[label]),
        );
        const at = (label: keyof typeof phases, offset: number) => phases[label] + offset;

        // Phase B: the dot hops onto the word's left edge and the bar shoots up.
        const hop = capHeight * wordScale * bang.hopPerCapHeight;
        tl.to(
          dot,
          {
            scaleX: bang.anticipate.scaleX,
            scaleY: bang.anticipate.scaleY,
            duration: bang.anticipate.duration,
            ease: bang.anticipate.ease,
          },
          at("bang", bang.anticipate.at),
        )
          .to(
            dot,
            { x: landX, duration: bang.travel.duration, ease: bang.travel.ease },
            at("bang", bang.travel.at),
          )
          .to(
            dot,
            {
              y: Math.min(0, restY) - hop,
              scaleX: bang.rise.scaleX * ballScale,
              scaleY: bang.rise.scaleY * ballScale,
              duration: bang.rise.duration,
              ease: bang.rise.ease,
            },
            at("bang", bang.rise.at),
          )
          .to(
            dot,
            { y: restY, duration: bang.fall.duration, ease: bang.fall.ease },
            at("bang", bang.fall.at),
          )
          .to(
            dot,
            {
              scaleX: bang.land.scaleX * ballScale,
              scaleY: bang.land.scaleY * ballScale,
              duration: bang.land.duration,
              ease: bang.land.ease,
            },
            at("bang", bang.land.at),
          )
          .to(
            dot,
            { scale: ballScale, duration: bang.settle.duration, ease: bang.settle.ease },
            at("bang", bang.settle.at),
          )
          .to(
            bar,
            { scaleY: 1, duration: bang.bar.duration, ease: bang.bar.ease },
            at("bang", bang.bar.at),
          );

        // Phase C: the bar falls like a domino and the letters flip up out of it.
        tl.to(
          bar,
          { rotation: 90, duration: letters.barTip.duration, ease: letters.barTip.ease },
          at("letters", letters.barTip.at),
        )
          .to(
            bar,
            // Its real length, with y following to pin the base: scaling this far
            // would stretch the rounded caps into points.
            {
              height: barLength,
              y: pivotY - barLength,
              duration: letters.barStretch.duration,
              ease: letters.barStretch.ease,
            },
            at("letters", letters.barStretch.at),
          )
          // One tween, so the far end holds still while the tail catches up to it.
          .to(
            bar,
            {
              x: wordRight - barWidth / 2,
              y: pivotY,
              height: 0,
              duration: letters.barRetract.duration,
              ease: letters.barRetract.ease,
            },
            at("letters", letters.barRetract.at),
          )
          .to(
            chars,
            {
              rotation: 0,
              rotationX: 0,
              duration: letters.flip.duration,
              ease: letters.flip.ease,
              stagger: letters.flip.stagger,
            },
            at("letters", letters.flip.at),
          )
          .to(
            chars,
            {
              opacity: 1,
              duration: letters.appear.duration,
              ease: letters.appear.ease,
              stagger: letters.appear.stagger,
            },
            at("letters", letters.appear.at),
          )
          .to(
            dot,
            { x: rollEndX, duration: letters.roll.duration, ease: letters.roll.ease },
            at("letters", letters.roll.at),
          );

        // Phase D: left to right, each slot flips edge-on and comes back changed.
        tl.set(chars, { transformOrigin: "50% 50%" }, at("swap", 0));
        chars.forEach((char, index) => {
          const start = at("swap", index * swap.stagger);
          const midpoint = start + swap.flipOut.duration;
          tl.to(
            char,
            { rotationX: 90, duration: swap.flipOut.duration, ease: swap.flipOut.ease },
            start,
          )
            .call(
              () => {
                char.textContent = toWord[index] ?? "";
              },
              undefined,
              midpoint,
            )
            .to(
              char,
              { rotationX: 0, duration: swap.flipIn.duration, ease: swap.flipIn.ease },
              midpoint,
            );
        });
        tl.to(
          chars,
          {
            x: (index: number) => toLefts[index] ?? lineBox.width,
            duration: swap.reflow.duration,
            ease: swap.reflow.ease,
          },
          at("swap", swap.reflow.at),
        ).to(
          dot,
          { x: finalRestX, duration: swap.reflow.duration, ease: swap.reflow.ease },
          at("swap", swap.reflow.at),
        );

        // Phase E: everything goes to its place in the real hero.
        tl.add(
          Flip.fit(word, landing, {
            scale: true,
            duration: handoff.word.duration,
            ease: handoff.word.ease,
          }) as gsap.core.Tween,
          at("handoff", handoff.word.at),
        ).to(
          word,
          { "--intro-fill": 0, duration: handoff.fill.duration, ease: handoff.fill.ease },
          at("handoff", handoff.fill.at),
        );
        // The seam: same glyphs, colour and position to within 0.1px. In one frame on
        // purpose, as fading the word off the line doubles up the glyph edges.
        const wordLanded = at("handoff", handoff.word.at + handoff.word.duration);
        tl.set(lineTwo, { opacity: 1 }, wordLanded).set(word, { opacity: 0 }, wordLanded);

        tl.fromTo(
          lineOne,
          { yPercent: 130, opacity: 1 },
          {
            yPercent: 0,
            duration: handoff.lineOne.duration,
            ease: handoff.lineOne.ease,
            immediateRender: false,
          },
          at("handoff", handoff.lineOne.at),
        );

        const dotTarget = eyebrowDot.getBoundingClientRect();
        const flightEnd = {
          x: dotTarget.left + dotTarget.width / 2 - centerX,
          y: dotTarget.top + dotTarget.height / 2 - centerY,
        };
        const flightControl = {
          x: (finalRestX + flightEnd.x) / 2,
          y: Math.min(restY, flightEnd.y) - viewportHeight * handoff.dot.arcPerViewport,
        };
        const setDotX = gsap.quickSetter(dot, "x", "px");
        const setDotY = gsap.quickSetter(dot, "y", "px");
        const flight = { progress: 0 };
        const dotLanded = at("handoff", handoff.dot.at + handoff.dot.duration);
        tl.to(
          flight,
          {
            progress: 1,
            duration: handoff.dot.duration,
            ease: handoff.dot.ease,
            onUpdate: () => {
              const t = flight.progress;
              const u = 1 - t;
              setDotX(u * u * finalRestX + 2 * u * t * flightControl.x + t * t * flightEnd.x);
              setDotY(u * u * restY + 2 * u * t * flightControl.y + t * t * flightEnd.y);
            },
          },
          at("handoff", handoff.dot.at),
        )
          .to(
            dot,
            {
              scale: dotTarget.width / size.dotBase,
              duration: handoff.dot.duration,
              ease: handoff.dot.ease,
            },
            at("handoff", handoff.dot.at),
          )
          .set(eyebrowDot, { opacity: 1 }, dotLanded)
          .set(dot, { opacity: 0 }, dotLanded)
          .fromTo(
            eyebrowText,
            { opacity: 0, y: handoff.eyebrowText.y },
            {
              opacity: 1,
              y: 0,
              duration: handoff.eyebrowText.duration,
              ease: handoff.eyebrowText.ease,
              immediateRender: false,
            },
            at("handoff", handoff.eyebrowText.at),
          );

        const portraitBox = portrait.getBoundingClientRect();
        tl.to(
          spotlight,
          {
            x: portraitBox.left + portraitBox.width / 2 - centerX,
            y: portraitBox.top + portraitBox.height / 2 - centerY,
            scale:
              (Math.max(portraitBox.width, portraitBox.height) *
                handoff.spotlight.sizePerPortrait) /
              spotlight.offsetWidth,
            duration: handoff.spotlight.duration,
            ease: handoff.spotlight.ease,
          },
          at("handoff", handoff.spotlight.at),
        )
          .to(
            spotlight,
            {
              opacity: 0,
              duration: handoff.spotlightFade.duration,
              ease: handoff.spotlightFade.ease,
            },
            at("handoff", handoff.spotlightFade.at),
          )
          .to(
            backdrop,
            { opacity: 0, duration: handoff.backdrop.duration, ease: handoff.backdrop.ease },
            at("handoff", handoff.backdrop.at),
          );

        // The photo paints under the opaque backdrop from the start, which is what
        // keeps it the page's LCP. It only has to be hidden once the backdrop lifts.
        tl.set(portrait, { opacity: 0 }, at("handoff", 0));
        // Below the hero's z-10 content, all still at opacity 0. From here the
        // spotlight really is behind the name and the portrait, so the name doesn't
        // change tone when the word above the spotlight swaps for the line under it.
        tl.set(floor, { zIndex: 5 }, at("handoff", 0));

        // Phase F: the portrait gathers while the rest of the page staggers in.
        const assembly = particlesRef.current?.assemble() ?? null;
        if (assembly) {
          tl.add(assembly, at("reveal", 0));
        } else {
          tl.fromTo(
            portrait,
            { opacity: 0 },
            {
              opacity: 1,
              duration: reveal.portraitFade.duration,
              ease: reveal.portraitFade.ease,
              immediateRender: false,
            },
            at("reveal", reveal.portraitFade.at),
          );
        }

        tl.fromTo(
          // Reversed: the social rail comes first in the DOM, the navbar leads here.
          [tagline, cta, ...[...document.querySelectorAll("[data-intro-chrome]")].reverse()],
          { opacity: 0, y: reveal.copy.y },
          {
            opacity: 1,
            y: 0,
            duration: reveal.copy.duration,
            ease: reveal.copy.ease,
            stagger: reveal.copy.stagger,
            immediateRender: false,
          },
          at("reveal", reveal.copy.at),
        );

        return tl;
      };

      const play = contextSafe!(() => {
        if (finished || unmounted) {
          return;
        }

        breathing.kill();
        // A session that has somehow already scrolled has no hero in view to land on.
        timeline = window.scrollY > 0 ? null : buildTimeline();
        if (timeline) {
          markIntroPlayed();
        } else {
          finish();
        }
      });

      const assets = Promise.allSettled([document.fonts?.ready, portrait.decode()]);
      void Promise.all([
        wait(INTRO.wait.minMs),
        Promise.race([assets, wait(INTRO.wait.maxMs)]),
      ]).then(play);

      return () => {
        unmounted = true;
        window.cancelAnimationFrame(revertFrame);
        removeListeners();
        if (!finished) {
          unlockScroll();
          html.setAttribute("data-intro", "done");
        }
      };
    },
    { scope: rootRef },
  );

  // Rendered on the server and shown purely by the head script's attribute, so it
  // is on screen from the first paint and React has nothing to reconcile.
  return (
    <>
      <div ref={floorRef} aria-hidden="true" className="hero-intro hero-intro-floor">
        <div ref={backdropRef} className="absolute inset-0 bg-background" />
        <div ref={spotlightRef} className="hero-intro-spotlight" />
      </div>
      <div ref={rootRef} aria-hidden="true" className="hero-intro">
        <div ref={landingRef} className="absolute top-0 left-0" />
        <div ref={wordRef} className="hero-intro-word" />
        <span ref={barRef} className="absolute top-0 left-0 rounded-full bg-foreground" />
        <span ref={dotRef} className="hero-intro-dot" />
      </div>
    </>
  );
}
