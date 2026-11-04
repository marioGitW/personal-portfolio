"use client";

import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

const PARTICLES = {
  sampleStep: 4.5,
  maxParticles: 4000,
  minAlpha: 120,
  sparkleChance: 0.05,
  size: { min: 1.5, max: 2.5 },
  // Pixel luminance (0-1) cut into the three token tones.
  tones: { darkBelow: 0.3, brightAbove: 0.6 },
  // How much a high-contrast pixel out-competes a flat one for the capped slots,
  // so the face and silhouette keep their detail and the plain shirt gives way.
  contrastWeight: 40,
  // Matches the solid stop of .hero-portrait-fade in globals.css. The canvas sits
  // outside that mask, so particles fade out with the photo by themselves.
  maskSolidUntil: 0.86,
  assemble: {
    particleDuration: 0.5,
    maxDelay: 0.3,
    ease: "power3.inOut",
    startAlpha: 0.12,
  },
  crossfade: { at: 0.62, duration: 0.3, ease: "none" },
  hover: {
    radius: 90,
    push: 1.5,
    spring: 0.05,
    friction: 0.86,
    // Particles share the photo's tones, so over a fully opaque photo they vanish
    // into it. 1 leaves the photo as it is.
    photoOpacity: 0.35,
    fadeIn: { duration: 0.25, ease: "power2.out" },
    leaveDelay: 0.5,
    fadeOut: { duration: 0.35, ease: "power2.inOut" },
    settledBelow: 0.05,
  },
} as const;

const PHYSICS_STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 4;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  size: number;
  alpha: number;
  opacity: number;
  tone: number;
};

export type ParticlePortraitHandle = {
  // Null when particles are off here (touch, narrow, reduced motion) or the image
  // has not loaded, which tells the intro to fade the photo in instead. The
  // timeline ends with the canvas crossfaded out and the photo showing.
  assemble: () => gsap.core.Timeline | null;
};

type ParticleField = ParticlePortraitHandle & {
  destroy: () => void;
};

type ParticlePortraitProps = {
  ref: Ref<ParticlePortraitHandle>;
  imageRef: RefObject<HTMLImageElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
};

// Dark pixels take the darkest of the three tokens and bright pixels the
// lightest, however the theme orders them. That is --border, --muted,
// --foreground in dark mode. Light mode runs the other way, and following the
// token names there would draw the portrait as a photographic negative.
function readTones(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const read = (token: string) => styles.getPropertyValue(token).trim();

  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  const lightness = (color: string) => {
    if (!context) {
      return 0;
    }
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const ordered = ["--border", "--muted", "--foreground"]
    .map(read)
    .map((color) => ({ color, value: lightness(color) }))
    .sort((a, b) => a.value - b.value)
    .map((tone) => tone.color);

  return [...ordered, read("--accent")];
}

function createParticleField(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  box: HTMLDivElement,
  section: HTMLElement,
): ParticleField {
  const hoverEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const context = canvas.getContext("2d");

  let particles: Particle[] = [];
  let tones = readTones();
  let stale = true;
  let assembling = false;
  let onScreen = true;
  let hovered = false;
  let pointer: { x: number; y: number } | null = null;
  let frame = 0;
  let lastFrameTime = 0;
  let stepBudget = 0;
  let fade: gsap.core.Timeline | null = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const draw = () => {
    if (!context || !onScreen) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    // Particles are sorted by tone, so the fill only changes a handful of times.
    let tone = -1;
    for (const particle of particles) {
      if (particle.tone !== tone) {
        tone = particle.tone;
        context.fillStyle = tones[tone];
      }
      context.globalAlpha = particle.opacity;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
  };

  // The photo's box sets where particles land, but they start scattered across
  // the whole hero, so the canvas is stretched from that box out to the section's
  // edges. Layout offsets, not rects: those include the parallax and the entrance's
  // scale, which would pull the particles off the photo they were sampled from.
  const sizeCanvas = () => {
    let originX = 0;
    let originY = 0;
    for (
      let element: HTMLElement | null = box;
      element && element !== section;
      element = element.offsetParent as HTMLElement | null
    ) {
      originX += element.offsetLeft;
      originY += element.offsetTop;
    }

    width = section.offsetWidth;
    height = section.offsetHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.left = `${box.offsetLeft - originX}px`;
    canvas.style.top = `${box.offsetTop - originY}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    return { originX, originY };
  };

  const sample = (originX: number, originY: number) => {
    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;
    const offscreen = document.createElement("canvas");
    offscreen.width = boxWidth;
    offscreen.height = boxHeight;
    const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offscreenContext || !boxWidth || !boxHeight) {
      return;
    }

    // The same crop the image's object-cover + object-top applies.
    const scale = Math.max(boxWidth / image.naturalWidth, boxHeight / image.naturalHeight);
    const sourceWidth = boxWidth / scale;
    const sourceHeight = boxHeight / scale;
    offscreenContext.drawImage(
      image,
      (image.naturalWidth - sourceWidth) / 2,
      0,
      sourceWidth,
      sourceHeight,
      0,
      0,
      boxWidth,
      boxHeight,
    );
    const { data } = offscreenContext.getImageData(0, 0, boxWidth, boxHeight);

    const luminanceAt = (x: number, y: number) => {
      const index = (Math.min(y, boxHeight - 1) * boxWidth + Math.min(x, boxWidth - 1)) * 4;
      return (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
    };

    const { sampleStep, minAlpha, maxParticles, contrastWeight } = PARTICLES;
    const candidates: { x: number; y: number; luminance: number; rank: number }[] = [];

    for (let rawY = 0; rawY < boxHeight; rawY += sampleStep) {
      for (let rawX = 0; rawX < boxWidth; rawX += sampleStep) {
        const x = Math.round(rawX);
        const y = Math.round(rawY);
        if (x >= boxWidth || y >= boxHeight || data[(y * boxWidth + x) * 4 + 3] <= minAlpha) {
          continue;
        }

        const luminance = luminanceAt(x, y);
        const contrast =
          Math.abs(luminance - luminanceAt(x + sampleStep, y)) +
          Math.abs(luminance - luminanceAt(x, y + sampleStep));
        // Weighted reservoir sampling: sort by rank, keep the first maxParticles.
        const rank = Math.random() ** (1 / (1 + contrast * contrastWeight));
        candidates.push({ x, y, luminance, rank });
      }
    }

    candidates.sort((a, b) => b.rank - a.rank);

    const { darkBelow, brightAbove } = PARTICLES.tones;
    particles = candidates
      .slice(0, maxParticles)
      .map(({ x, y, luminance }) => {
        const targetX = x + originX;
        const targetY = y + originY;
        const progressDown = y / boxHeight;
        const alpha =
          progressDown > PARTICLES.maskSolidUntil
            ? 1 - (progressDown - PARTICLES.maskSolidUntil) / (1 - PARTICLES.maskSolidUntil)
            : 1;
        const tone =
          Math.random() < PARTICLES.sparkleChance
            ? 3
            : luminance < darkBelow
              ? 0
              : luminance > brightAbove
                ? 2
                : 1;

        return {
          x: targetX,
          y: targetY,
          vx: 0,
          vy: 0,
          startX: 0,
          startY: 0,
          targetX,
          targetY,
          delay: 0,
          size: PARTICLES.size.min + Math.random() * (PARTICLES.size.max - PARTICLES.size.min),
          alpha,
          opacity: alpha,
          tone,
        };
      })
      .sort((a, b) => a.tone - b.tone);
  };

  const prepare = () => {
    if (!context || !image.complete || !image.naturalWidth) {
      return false;
    }

    const { originX, originY } = sizeCanvas();
    if (stale) {
      sample(originX, originY);
      stale = false;
    }
    return particles.length > 0;
  };

  // A hidden canvas this size is a real allocation, so it is only kept while in use.
  const releaseCanvas = () => {
    canvas.width = 0;
    canvas.height = 0;
  };

  const step = () => {
    const { radius, push, spring, friction, settledBelow } = PARTICLES.hover;
    let moving = false;

    for (const particle of particles) {
      if (pointer) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < radius * radius && distanceSquared > 0.01) {
          const distance = Math.sqrt(distanceSquared);
          const force = (1 - distance / radius) * push;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      particle.vx = (particle.vx + (particle.targetX - particle.x) * spring) * friction;
      particle.vy = (particle.vy + (particle.targetY - particle.y) * spring) * friction;
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (Math.abs(particle.vx) + Math.abs(particle.vy) > settledBelow) {
        moving = true;
      }
    }

    return moving;
  };

  const tick = (time: number) => {
    frame = 0;
    stepBudget += Math.min(time - lastFrameTime, PHYSICS_STEP_MS * MAX_STEPS_PER_FRAME);
    lastFrameTime = time;

    let moving = true;
    while (stepBudget >= PHYSICS_STEP_MS) {
      moving = step();
      stepBudget -= PHYSICS_STEP_MS;
    }

    draw();

    // A still pointer reaches equilibrium too, so this also stops while hovered.
    // The next pointermove restarts it.
    if (moving) {
      frame = window.requestAnimationFrame(tick);
    }
  };

  const startLoop = () => {
    if (frame || !onScreen) {
      return;
    }
    lastFrameTime = performance.now();
    frame = window.requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const pointerToCanvas = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const enterHover = () => {
    if (!prepare()) {
      return;
    }
    hovered = true;
    fade?.kill();
    fade = gsap
      .timeline({ defaults: PARTICLES.hover.fadeIn })
      .to(canvas, { opacity: 1 }, 0)
      .to(image, { opacity: PARTICLES.hover.photoOpacity }, 0);
    draw();
  };

  const leaveHover = () => {
    hovered = false;
    pointer = null;
    fade?.kill();
    fade = gsap
      .timeline({
        delay: PARTICLES.hover.leaveDelay,
        defaults: PARTICLES.hover.fadeOut,
        onComplete: () => {
          stopLoop();
          releaseCanvas();
        },
      })
      .to(canvas, { opacity: 0 }, 0)
      .to(image, { opacity: 1, clearProps: "opacity" }, 0);
    startLoop();
  };

  // On the section rather than the canvas: the portrait column is
  // pointer-events-none, so the buttons and name under its box stay clickable.
  const handlePointerMove = (event: PointerEvent) => {
    if (assembling) {
      return;
    }

    const rect = box.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (inside && !hovered) {
      enterHover();
    } else if (!inside && hovered) {
      leaveHover();
    }

    if (hovered) {
      pointer = pointerToCanvas(event);
      startLoop();
    }
  };

  const handlePointerLeave = () => {
    if (hovered) {
      leaveHover();
    }
  };

  if (hoverEnabled) {
    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
  }

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (!onScreen) {
      stopLoop();
    } else if (hovered) {
      startLoop();
    }
  });
  visibility.observe(section);

  const resize = new ResizeObserver(() => {
    stale = true;
    if (hovered) {
      prepare();
      draw();
    }
  });
  resize.observe(box);

  const themeChange = new MutationObserver(() => {
    tones = readTones();
    if (canvas.width) {
      draw();
    }
  });
  themeChange.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  return {
    assemble() {
      if (!prepare()) {
        return null;
      }

      const { particleDuration, maxDelay, ease, startAlpha } = PARTICLES.assemble;
      const easing = gsap.parseEase(ease);
      for (const particle of particles) {
        particle.startX = Math.random() * width;
        particle.startY = Math.random() * height;
        particle.delay = Math.random() * maxDelay;
      }

      const clock = { time: 0 };
      const duration = particleDuration + maxDelay;
      assembling = true;

      return gsap
        .timeline({
          onComplete: () => {
            assembling = false;
            releaseCanvas();
          },
        })
        .set(canvas, { opacity: 1 })
        .to(clock, {
          time: duration,
          duration,
          ease: "none",
          onUpdate: () => {
            for (const particle of particles) {
              const progress = Math.min(
                Math.max((clock.time - particle.delay) / particleDuration, 0),
                1,
              );
              const eased = easing(progress);
              particle.x = particle.startX + (particle.targetX - particle.startX) * eased;
              particle.y = particle.startY + (particle.targetY - particle.startY) * eased;
              particle.opacity = particle.alpha * (startAlpha + (1 - startAlpha) * eased);
            }
            draw();
          },
        })
        .fromTo(
          image,
          { opacity: 0 },
          {
            opacity: 1,
            duration: PARTICLES.crossfade.duration,
            ease: PARTICLES.crossfade.ease,
            immediateRender: false,
          },
          PARTICLES.crossfade.at,
        )
        .to(
          canvas,
          {
            opacity: 0,
            duration: PARTICLES.crossfade.duration,
            ease: PARTICLES.crossfade.ease,
          },
          PARTICLES.crossfade.at,
        );
    },

    destroy() {
      stopLoop();
      fade?.kill();
      gsap.set(image, { clearProps: "opacity" });
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
      visibility.disconnect();
      resize.disconnect();
      themeChange.disconnect();
      releaseCanvas();
    },
  };
}

export function ParticlePortrait({ ref, imageRef, boxRef, sectionRef }: ParticlePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);

  useImperativeHandle(ref, () => ({ assemble: () => fieldRef.current?.assemble() ?? null }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const box = boxRef.current;
    const section = sectionRef.current;
    if (!canvas || !image || !box || !section) {
      return;
    }

    if (
      prefersReducedMotion() ||
      window.matchMedia("(max-width: 767px), (pointer: coarse)").matches
    ) {
      return;
    }

    const field = createParticleField(canvas, image, box, section);
    fieldRef.current = field;

    return () => {
      field.destroy();
      fieldRef.current = null;
    };
  }, [imageRef, boxRef, sectionRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      width={0}
      height={0}
      className="absolute z-10 opacity-0"
    />
  );
}
