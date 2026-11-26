"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import type { MosaicPortraitHandle } from "@/components/sections/MosaicPortrait";
import {
  HERO_NAME_CLASSES,
  INTRO_START_MS,
  markIntroPlayed,
  noteIntro,
  showIntroLog,
} from "@/lib/intro";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { listenForTaps } from "@/lib/tap";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, SplitText);
}

// Every duration and easing of the intro. Times are seconds, and each "at" is an
// offset from the start of its phase. The portrait's timing lives in MosaicPortrait.
const INTRO = {
  word: "PORTFOLIO",
  // Phase A: the wait for assets, before the timeline below starts. The word is measured in the
  // real font, so without it in time the intro is dropped rather than built on the fallback's
  // metrics. The image can arrive later, as the mosaic waits for it. The dot is on screen for
  // minMs at least, counted from when the page was parsed: a phone has shown it for longer than
  // that by the time its script runs, and doesn't wait again.
  wait: { minMs: 400, imageMaxMs: 1500, marginMs: 200 },
  // A phone plays the same timeline in this share of the time.
  compact: 0.85,
  // Reduced motion, where nothing moves: the backdrop goes and the hero comes, in 0.55s.
  still: {
    fadeOut: { at: 0, duration: 0.25, ease: "none" },
    fadeIn: { at: 0.15, duration: 0.4, ease: "none" },
  },
  // How long the timeline may stand still, or run over, before the hero is shown regardless.
  stall: { maxMs: 1500, checkMs: 250 },
  // Where each phase starts on the master timeline.
  phases: { bang: 0, letters: 0.4, swap: 1.2, handoff: 1.8, reveal: 2.2 },
  // The dot's size in the stylesheet, which it is scaled from.
  size: { dotBase: 14 },
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
    lineOne: { at: 0.1, duration: 0.6, ease: "power4.out" },
    dot: { at: 0, duration: 0.55, ease: "power3.inOut", arcPerViewport: 0.18 },
    eyebrowText: { at: 0.25, duration: 0.4, ease: "power3.out", y: 16 },
    spotlight: { at: 0, duration: 0.6, ease: "power3.inOut", sizePerPortrait: 1.15 },
    spotlightFade: { at: 0.25, duration: 0.5, ease: "power1.in" },
    backdrop: { at: 0, duration: 0.6, ease: "power1.inOut" },
  },
  reveal: {
    copy: { at: 0, y: 16, duration: 0.5, stagger: 0.06, ease: "power3.out" },
  },
} as const;

// A phone plays the intro shorter, and reduced motion a fade. Crossing from one to another part
// way through ends it, since it was measured for the layout it started in.
const VERSIONS = {
  still: "(prefers-reduced-motion: reduce)",
  compact: "(max-width: 767.98px)",
  full: "(min-width: 768px)",
};

// Not touchstart: a finger on the screen is as often the start of a scroll, or nothing at all, as
// a wish to skip, and a moving mouse skips nothing either. A tap is one, and is listened for. The
// click is a mouse's, since a finger's follows a long press as well.
const SKIP_EVENTS = ["click", "keydown", "wheel"] as const;

// How long after a tap its click may come.
const CLICK_AFTER_TAP_MS = 500;

// What GSAP writes to the elements of the page itself.
const TWEENED = ["opacity", "transform", "translate", "rotate", "scale"] as const;

// Everything that decides how the name's glyphs look, read off the real line so the word
// cannot drift from it.
const WORD_STYLES = [
  "font-family",
  "font-weight",
  "font-size",
  "line-height",
  "letter-spacing",
  "text-transform",
  "font-feature-settings",
  "font-variation-settings",
  "font-kerning",
  "color",
  "-webkit-text-stroke-width",
  "-webkit-text-stroke-color",
  "text-shadow",
  "background-image",
  "background-clip",
] as const;

// Not inherited, and a clipped background has to be on the box the glyphs are in.
const LETTER_STYLES = ["background-image", "background-clip"] as const;

function copyStyles(
  from: HTMLElement,
  to: HTMLElement,
  properties: readonly string[] = WORD_STYLES,
) {
  const styles = getComputedStyle(from);
  properties.forEach((property) => {
    to.style.setProperty(property, styles.getPropertyValue(property));
  });
}

function fontOf(element: HTMLElement) {
  const { fontWeight, fontSize, fontFamily } = getComputedStyle(element);
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

// Dev only. Runs on the last frame before the swap, when any difference would show.
function warnIfWordDiffersFromLine(
  word: HTMLElement,
  letters: HTMLElement[],
  line: HTMLElement,
  text: Text,
) {
  const wordStyles = getComputedStyle(word);
  const lineStyles = getComputedStyle(line);
  const differing = WORD_STYLES.filter(
    (property) => wordStyles.getPropertyValue(property) !== lineStyles.getPropertyValue(property),
  ).map(
    (property) =>
      `${property}: ${wordStyles.getPropertyValue(property)} vs ${lineStyles.getPropertyValue(property)}`,
  );

  const range = document.createRange();
  const lineTop = line.getBoundingClientRect().top;
  const displaced = letters.slice(0, text.length).flatMap((letter, index) => {
    range.setStart(text, index);
    range.setEnd(text, index + 1);
    const box = letter.getBoundingClientRect();
    const dx = box.left - range.getBoundingClientRect().left;
    const dy = box.top - lineTop;
    return Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
      ? [`${text.data[index]} off by ${dx.toFixed(2)}, ${dy.toFixed(2)}`]
      : [];
  });

  if (differing.length || displaced.length) {
    console.warn("[HeroIntro] The word does not match the line it lands on.", {
      differing,
      displaced,
    });
  }
}

type HeroIntroProps = {
  mosaicRef: RefObject<MosaicPortraitHandle | null>;
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Once what was just built has been painted: the second frame from here begins after the first
// has been on screen. Returns what cancels it.
function afterPaint(callback: () => void) {
  let frame = window.requestAnimationFrame(() => {
    frame = window.requestAnimationFrame(callback);
  });
  return () => window.cancelAnimationFrame(frame);
}

// The click that comes after a tap lands on whatever is there by then, and the intro it was meant
// for no longer is.
function dropNextClick() {
  const drop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", drop, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", drop, true), CLICK_AFTER_TAP_MS);
}

export function HeroIntro({ mosaicRef }: HeroIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (context) => {
      const headTimer = window.__introFailsafe;
      if (!headTimer) {
        // ?introDebug, where the head script gave up waiting for this.
        if (window.__introLog && document.documentElement.dataset.intro === "done") {
          noteIntro("script running, after the hero was shown");
          showIntroLog();
        }
        return;
      }
      // Taken over from the head script, whose timer knows nothing of what is set up below. From
      // here the intro has INTRO_START_MS to start: the time it took to get here is the network's
      // and the phone's, and isn't counted against it.
      window.clearTimeout(headTimer);
      noteIntro("script running");
      const startBy = performance.now() + INTRO_START_MS;
      const parsedAt = window.__introStart ?? performance.now();

      const html = document.documentElement;
      // React's dev-only Strict Mode remount strips the attribute off <html>. A
      // no-op in production, where the head script's value is still there.
      html.setAttribute("data-intro", "pending");

      const root = rootRef.current;
      const floor = floorRef.current;
      const backdrop = backdropRef.current;
      const spotlight = spotlightRef.current;
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
      const shown = Array.from(section?.querySelectorAll<HTMLElement>("[data-intro-hide]") ?? []);
      // Outside the hero: the header, and the social rail when there is one.
      const chrome = Array.from(document.querySelectorAll<HTMLElement>("[data-intro-chrome]"));

      let timeline: gsap.core.Timeline | null = null;
      let started = false;
      let finished = false;
      let unmounted = false;
      let startWidth = 0;
      let failsafe = 0;
      let watchdog = 0;
      let revertFrame = 0;
      let stopTaps = () => {};

      const stopWatching = () => {
        window.clearTimeout(failsafe);
        window.clearInterval(watchdog);
        SKIP_EVENTS.forEach((type) => window.removeEventListener(type, handleSkip, true));
        window.removeEventListener("pointerdown", notePointer, true);
        stopTaps();
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("error", handleError);
      };

      const finish = (reason = "played to the end") => {
        if (finished) {
          return;
        }
        finished = true;
        noteIntro(`hero shown: ${reason}`);
        window.setTimeout(showIntroLog, 400);
        window.__introFailsafe = 0;
        stopWatching();
        markIntroPlayed();
        unlockScroll();
        // The attribute first, so the CSS hide never outlives GSAP's inline values.
        // Everything is at its final value by now and the revert only takes those
        // inline styles away.
        html.setAttribute("data-intro", "done");
        // Only does anything if the timeline never got to assemble the portrait, or not to the
        // end of it: a skip during the wait, an image that had not loaded by the time it was
        // built, or a failure part way.
        try {
          mosaicRef.current?.finish();
        } catch (error) {
          console.error("[HeroIntro] The portrait could not be shown.", error);
        }
        revertFrame = window.requestAnimationFrame(tidy);
      };

      const tidy = () => {
        window.cancelAnimationFrame(revertFrame);
        try {
          context.revert();
        } catch (error) {
          console.error("[HeroIntro] Not everything could be put back.", error);
        }
        // The revert has done this, unless it didn't get that far.
        for (const element of [...shown, ...chrome]) {
          TWEENED.forEach((property) => element.style.removeProperty(property));
        }
        // SplitText's revert puts the intro word back.
        wordRef.current?.replaceChildren();
      };

      // At once, and not a frame later: there may not be another.
      const fail = (error: unknown) => {
        if (!finished) {
          console.error("[HeroIntro] Dropped for the finished hero.", error);
          finish(`failed, ${error instanceof Error ? error.message : String(error)}`);
          tidy();
        }
      };

      const skip = (reason: string) => {
        try {
          timeline?.progress(1);
        } finally {
          finish(reason);
        }
      };

      let fingers = false;
      const notePointer = (event: PointerEvent) => {
        fingers = event.pointerType !== "mouse";
      };
      const handleSkip = (event: Event) => {
        if (event.type !== "click" || !fingers) {
          skip(`skipped by ${event.type}`);
        }
      };

      // The landing spots were measured for this width, so don't play on past it. Before they
      // are, any width will do.
      const handleResize = () => {
        if (startWidth > 0 && root && root.clientWidth !== startWidth) {
          skip(`width changed from ${startWidth} to ${root.clientWidth}`);
        }
      };

      // This site's own scripts alone: what an in-app browser injects throws all day.
      const handleError = (event: ErrorEvent) => {
        if (event.filename.includes("/_next/")) {
          fail(event.error);
        }
      };

      if (
        !root ||
        !floor ||
        !backdrop ||
        !spotlight ||
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
        finish("a part of the hero is missing");
        return;
      }

      failsafe = window.setTimeout(
        () => finish(`not started within ${INTRO_START_MS}ms of the script running`),
        INTRO_START_MS,
      );
      SKIP_EVENTS.forEach((type) =>
        window.addEventListener(type, handleSkip, { capture: true, passive: true }),
      );
      window.addEventListener("pointerdown", notePointer, { capture: true, passive: true });
      stopTaps = listenForTaps(window, () => {
        dropNextClick();
        skip("skipped by a tap");
      });
      window.addEventListener("resize", handleResize);
      window.addEventListener("error", handleError);
      lockScroll();

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

        // Line two's box, its text box and its kerned letter positions, all read-only. A
        // split word loses kerning, and the "PA" and "OV" pairs would visibly jump at the
        // swap, so the letters are placed from these rather than left to flow.
        const lineRect = lineTwo.getBoundingClientRect();
        const lineBox = boundsOf(lineTwoText);
        const lineStyles = getComputedStyle(lineTwo);
        const toWord = lineTwoText.data.toUpperCase();
        const toLefts = lettersOf(lineTwoText, lineBox.left);

        copyStyles(lineTwo, word);
        // autoRound off: GSAP snaps px values to whole pixels by default, and a line box
        // of 154.8px rendered at 155px would land visibly wrong.
        gsap.set(word, { autoRound: false, width: lineBox.width, height: lineRect.height });

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
        }).chars as HTMLElement[];
        chars.forEach((char, index) => {
          char.textContent = INTRO.word[index] ?? "";
          copyStyles(lineTwo, char, LETTER_STYLES);
        });

        const measuring = document.createElement("canvas").getContext("2d");
        if (!measuring) {
          return null;
        }
        measuring.font = fontOf(lineTwo);
        const capMetrics = measuring.measureText("H");
        const ascent = capMetrics.fontBoundingBoxAscent;
        const capHeight = capMetrics.actualBoundingBoxAscent;
        const stemMetrics = measuring.measureText("I");
        const stemWidth = stemMetrics.actualBoundingBoxLeft + stemMetrics.actualBoundingBoxRight;

        const viewportWidth = root.clientWidth;
        const viewportHeight = root.clientHeight;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const { size } = INTRO;

        // The caps, rather than the taller line box, are what sit dead centre. The word has
        // the line's box and line-height, so its baseline is as far down as the line's is.
        const baselineY = centerY + capHeight / 2;
        const wordY = baselineY - (lineBox.top - lineRect.top + ascent);
        const screenX = (localX: number) => centerX + localX - lineBox.width / 2;

        gsap.set(word, { x: centerX - lineBox.width / 2, y: wordY });
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

        // The "!", in the font's own proportions: an "I" stem as tall as the caps, standing
        // over a ball as wide as the stem, on the word's left edge.
        const ball = stemWidth;
        const ballScale = ball / size.dotBase;
        const barWidth = stemWidth;
        const barHeight = capHeight;
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
          backgroundColor: lineStyles.color,
        });

        // The dot's stylesheet position is the viewport centre, so x/y are offsets.
        const restY = ballY - centerY;
        const landX = pivotX - centerX;
        const rollEndX = wordRight + ball - centerX;
        const finalRestX = finalRight + ball - centerX;

        const { phases, bang, letters, swap, handoff, reveal } = INTRO;
        const tl = gsap.timeline({ paused: true, onComplete: finish });
        (Object.keys(phases) as (keyof typeof phases)[]).forEach((label) =>
          tl.addLabel(label, phases[label]),
        );
        const at = (label: keyof typeof phases, offset: number) => phases[label] + offset;

        // Phase B: the dot hops onto the word's left edge and the bar shoots up.
        const hop = capHeight * bang.hopPerCapHeight;
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
            // Its real length, with y following to pin the base.
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

        // Phase E: everything goes to its place in the real hero. The letters already sit
        // on the line's kerned positions and the word is the line's size, so a translation
        // is all that is left. No perspective either, which would keep them on a soft layer.
        // Rounded because that is where the line paints: Chrome puts a text box's top on a
        // whole pixel, and a transform would otherwise honour the fraction and land the
        // glyphs a pixel off it on a 2x screen.
        tl.set(chars, { transformPerspective: 0 }, at("handoff", handoff.word.at)).to(
          word,
          {
            x: lineBox.left,
            y: Math.round(lineRect.top),
            duration: handoff.word.duration,
            ease: handoff.word.ease,
          },
          at("handoff", handoff.word.at),
        );
        // The seam: same glyphs, paint and position. In one frame on purpose, as fading the
        // word off the line doubles up the glyph edges.
        const wordLanded = at("handoff", handoff.word.at + handoff.word.duration);
        if (process.env.NODE_ENV !== "production") {
          tl.call(
            () => warnIfWordDiffersFromLine(word, chars, lineTwo, lineTwoText),
            undefined,
            wordLanded,
          );
        }
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

        // Below the hero's z-10 content, all still at opacity 0. From here the
        // spotlight really is behind the name and the portrait, so the name doesn't
        // change tone when the word above the spotlight swaps for the line under it.
        tl.set(floor, { zIndex: 5 }, at("handoff", 0));

        // Phase F: the portrait gathers while the rest of the page staggers in. Not before
        // the word has become the real name: the word is above the tiles and the name is
        // behind them, so swapping one for the other under tiles in the air would show.
        const assembly = mosaicRef.current?.assemble() ?? null;
        if (assembly) {
          tl.add(assembly, wordLanded);
        }

        tl.fromTo(
          // Reversed: the social rail comes first in the DOM, the navbar leads here.
          [tagline, cta, ...[...chrome].reverse()],
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

      // Reduced motion: the backdrop fades off and the finished hero, portrait and all, fades in.
      const buildFade = () => {
        const { fadeOut, fadeIn } = INTRO.still;
        const tl = gsap.timeline({ paused: true, onComplete: finish });
        tl.to(
          [floor, root],
          { opacity: 0, duration: fadeOut.duration, ease: fadeOut.ease },
          fadeOut.at,
        ).fromTo(
          [...shown, ...chrome],
          { opacity: 0 },
          { opacity: 1, duration: fadeIn.duration, ease: fadeIn.ease, immediateRender: false },
          fadeIn.at,
        );

        const portraitFade = mosaicRef.current?.appear(fadeIn.duration) ?? null;
        if (portraitFade) {
          tl.add(portraitFade, fadeIn.at);
        }
        return tl;
      };

      // GSAP's clock only moves with its frames, so this one is the browser's.
      const watch = (tl: gsap.core.Timeline) => {
        const { maxMs, checkMs } = INTRO.stall;
        const endBy = performance.now() + (tl.duration() / tl.timeScale()) * 1000 + maxMs;
        let time = -1;
        let movedAt = performance.now();
        watchdog = window.setInterval(() => {
          const now = performance.now();
          // A hidden tab has no frames, and has caught up by the first it is shown in.
          if (document.hidden || tl.time() !== time) {
            time = tl.time();
            movedAt = now;
          }
          if (now - movedAt > maxMs || (now > endBy && !document.hidden)) {
            fail(new Error(`The timeline stopped at ${time.toFixed(2)}s`));
          }
        }, checkMs);
      };

      // The fonts and the portrait, or as long as there is left to wait for them.
      const assets = () => {
        const left = Math.max(startBy - performance.now() - INTRO.wait.marginMs, 0);
        const fonts = Promise.allSettled([
          document.fonts.load(fontOf(lineTwo), lineTwo.textContent ?? ""),
          document.fonts.ready,
        ]).then(() => noteIntro("fonts loaded"));
        const image = Promise.allSettled([portrait.decode()]).then(() =>
          noteIntro("portrait decoded"),
        );
        return Promise.all([
          Promise.race([fonts, wait(left)]),
          Promise.race([image, wait(Math.min(INTRO.wait.imageMaxMs, left))]),
        ]);
      };

      // What is left of the dot's least time on screen.
      const dotTime = (minMs: number) =>
        wait(Math.min(minMs - (performance.now() - parsedAt), startBy - performance.now()));

      // Nothing else catches what a promise or a frame throws.
      const attempt = (step: () => void) => {
        try {
          step();
        } catch (error) {
          fail(error);
        }
      };

      gsap.matchMedia().add(VERSIONS, (version) => {
        if (finished || started) {
          finish("the layout changed");
          return;
        }

        const { still, compact } = version.conditions as Record<keyof typeof VERSIONS, boolean>;
        let cancelled = false;
        let cancelPaint = () => {};

        const play = () => {
          if (cancelled || finished || unmounted || !timeline) {
            return;
          }

          started = true;
          window.clearTimeout(failsafe);
          // Where the stylesheet's breathing has got to, for the timeline to go on from.
          const { a, d } = new DOMMatrixReadOnly(getComputedStyle(dot).transform);
          dot.style.animation = "none";
          version.add(() => {
            gsap.set(dot, { scaleX: a, scaleY: d });
          });
          markIntroPlayed();
          timeline.play();
          noteIntro("intro started");
          watch(timeline);
        };

        // Everything slow, the tiles above all, before the clock starts: it counts every
        // millisecond the page is busy, so whatever is done after that is so much of the intro
        // that nobody sees. While the dot is still on screen, if it has to be anyway.
        const prepare = () => {
          if (cancelled || finished || unmounted || still) {
            return;
          }
          const from = performance.now();
          mosaicRef.current?.prepare();
          noteIntro(`mosaic built in ${Math.round(performance.now() - from)}ms`);
        };

        const build = () => {
          if (cancelled || finished || unmounted) {
            return;
          }

          // A session that has somehow already scrolled has no hero in view to land on.
          if (window.scrollY > 0) {
            finish("the page was already scrolled");
            return;
          }
          if (!document.fonts.check(fontOf(lineTwo))) {
            finish("the font had not loaded in time");
            return;
          }

          startWidth = root.clientWidth;
          version.add(() => {
            timeline = still ? buildFade() : buildTimeline();
          });
          if (!timeline) {
            finish("the title has no second line to land on");
            return;
          }
          if (compact && !still) {
            timeline.timeScale(1 / INTRO.compact);
          }
          // A frame to paint what was just built in, before the clock starts.
          cancelPaint = afterPaint(() => attempt(play));
        };

        void assets()
          .then(() => attempt(prepare))
          .then(() => dotTime(still ? 0 : INTRO.wait.minMs))
          .then(() => attempt(build), fail);

        return () => {
          cancelled = true;
          cancelPaint();
          dot.style.animation = "";
        };
      });

      return () => {
        unmounted = true;
        window.cancelAnimationFrame(revertFrame);
        stopWatching();
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
        <div ref={wordRef} className={`hero-intro-word ${HERO_NAME_CLASSES}`} />
        <span ref={barRef} className="absolute top-0 left-0" />
        <span ref={dotRef} className="hero-intro-dot" />
      </div>
    </>
  );
}
