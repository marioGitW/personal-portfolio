"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";

/**
 * Every dial for the effect. Raise `opacityDark`/`opacityLight` to make the
 * smoke stronger, lower `spawnDistance` for a denser trail, raise `lifetimeMs`
 * for a longer one.
 */
export const SMOKE_CONFIG = {
  /** Hard ceiling on live puffs. The trail self-limits well below this. */
  maxPuffs: 34,
  /** Pointer travel, in px, before another puff is allowed. */
  spawnDistance: 30,
  /** Floor on the gap between puffs, in ms. */
  spawnInterval: 60,
  /** Puff lifetime range, in ms. */
  lifetimeMs: [1700, 2900] as const,
  /** Puff diameter range at birth, in px. */
  sizePx: [130, 240] as const,
  /** Extra diameter gained over a full lifetime, as a fraction of birth size. */
  growth: 1.5,
  /** Peak alpha per puff. The single most useful dial. */
  opacityDark: 0.17,
  opacityLight: 0.1,
  /** Whole-layer CSS blur, in px. Softens the low-res upscale. */
  blurPx: 12,
  /** How fast the spawn point chases the real pointer. Lower = more lag. */
  cursorSmoothing: 0.13,
  /** Share of pointer velocity a new puff inherits. */
  drift: 0.34,
  /** Per-frame wander. Above ~0.15 it stops reading as smoke. */
  turbulence: 0.05,
  /** Upward bias, in px/frame. Negative rises. */
  rise: -0.05,
  /** Velocity retained per frame. */
  damping: 0.985,
  /** Backing-store scale. 0.5 renders at half res and upscales — the blur hides it. */
  resolutionScale: 0.5,
} as const;

const FINE_POINTER = "(pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** A cursor-following effect is meaningless without a cursor, and unwelcome
 *  when the viewer has asked for less motion. */
function subscribeEnvironment(onChange: () => void) {
  const fine = window.matchMedia(FINE_POINTER);
  const reduced = window.matchMedia(REDUCED_MOTION);
  fine.addEventListener("change", onChange);
  reduced.addEventListener("change", onChange);
  return () => {
    fine.removeEventListener("change", onChange);
    reduced.removeEventListener("change", onChange);
  };
}

function readEnvironment() {
  return window.matchMedia(FINE_POINTER).matches && !window.matchMedia(REDUCED_MOTION).matches;
}

type Rgb = [number, number, number];

/** Pulls the accent tokens out of the theme so the smoke never drifts from the
 *  palette. Falls back to the literals in globals.css if the custom property
 *  is not exposed. */
function readAccent(name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (!hex) {
    return fallback;
  }
  const value = parseInt(hex[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * One irregular cloud, baked once into an offscreen canvas. Stacking a handful
 * of offset radial gradients is what keeps it from reading as a disc, and
 * pre-baking means each frame is a drawImage rather than a gradient rebuild.
 */
function createPuffSprite([r, g, b]: Rgb, seed: number): HTMLCanvasElement {
  const size = 256;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;

  const ctx = sprite.getContext("2d");
  if (!ctx) {
    return sprite;
  }

  let state = seed;
  const random = () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;

  for (let i = 0; i < 7; i++) {
    const radius = size * (0.17 + random() * 0.17);
    const x = size / 2 + (random() - 0.5) * size * 0.34;
    const y = size / 2 + (random() - 0.5) * size * 0.34;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.42)`);
    gradient.addColorStop(0.45, `rgba(${r},${g},${b},0.14)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  return sprite;
}

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  seed: number;
  sprite: number;
  rotation: number;
  spin: number;
};

/**
 * An ambient smoke trail that follows the pointer, painted on a single canvas
 * pinned behind every piece of page content. See SMOKE_CONFIG for the dials,
 * and the comment on the returned element for the layering contract.
 */
export function CursorSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useSyncExternalStore(subscribeEnvironment, readEnvironment, () => false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const root = document.documentElement;
    const sprites = [
      createPuffSprite(readAccent("--color-accent-from", [99, 102, 241]), 0x9e3779b9),
      createPuffSprite(readAccent("--color-accent-to", [34, 211, 238]), 0x85ebca6b),
    ];

    let isDark = root.classList.contains("dark");
    const themeObserver = new MutationObserver(() => {
      isDark = root.classList.contains("dark");
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    let width = 0;
    let height = 0;

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * SMOKE_CONFIG.resolutionScale;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      // Resizing the backing store resets the context, so the transform that
      // lets the rest of this file work in CSS pixels is reapplied here.
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    resize();

    const puffs: Puff[] = [];
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let previousX = 0;
    let previousY = 0;
    let spawnX = 0;
    let spawnY = 0;
    let lastSpawnAt = 0;
    let tracking = false;
    let pointerInside = false;
    let dirty = false;

    const handleMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerInside = true;

      if (!tracking) {
        smoothX = previousX = spawnX = pointerX;
        smoothY = previousY = spawnY = pointerY;
        tracking = true;
      }
    };

    // Stops feeding the trail; puffs already in flight still finish their life.
    const handleLeave = () => {
      pointerInside = false;
    };

    const spawn = (now: number) => {
      const [minLife, maxLife] = SMOKE_CONFIG.lifetimeMs;
      const [minSize, maxSize] = SMOKE_CONFIG.sizePx;

      puffs.push({
        x: smoothX,
        y: smoothY,
        vx: (smoothX - previousX) * SMOKE_CONFIG.drift,
        vy: (smoothY - previousY) * SMOKE_CONFIG.drift,
        born: now,
        life: minLife + Math.random() * (maxLife - minLife),
        size: minSize + Math.random() * (maxSize - minSize),
        seed: Math.random() * Math.PI * 2,
        sprite: Math.random() < 0.5 ? 0 : 1,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.006,
      });
    };

    const tick = (_time: number, deltaMs: number) => {
      // Clamped so a stalled tab does not teleport the whole trail on resume.
      const frames = Math.min(deltaMs, 50) / (1000 / 60);
      const now = performance.now();

      if (tracking) {
        previousX = smoothX;
        previousY = smoothY;
        const ease = Math.min(1, SMOKE_CONFIG.cursorSmoothing * frames);
        smoothX += (pointerX - smoothX) * ease;
        smoothY += (pointerY - smoothY) * ease;
      }

      if (tracking && pointerInside && puffs.length < SMOKE_CONFIG.maxPuffs) {
        const dx = smoothX - spawnX;
        const dy = smoothY - spawnY;
        const movedEnough = Math.hypot(dx, dy) >= SMOKE_CONFIG.spawnDistance;

        if (movedEnough && now - lastSpawnAt >= SMOKE_CONFIG.spawnInterval) {
          spawn(now);
          spawnX = smoothX;
          spawnY = smoothY;
          lastSpawnAt = now;
        }
      }

      // Idle pointer, empty trail: clear once, then leave the canvas alone.
      if (puffs.length === 0) {
        if (dirty) {
          ctx.clearRect(0, 0, width, height);
          dirty = false;
        }
        return;
      }

      dirty = true;
      ctx.clearRect(0, 0, width, height);
      // Additive glow reads as light haze on the dark theme; on the light one it
      // would wash out to white, so the smoke is painted normally instead.
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";
      const peak = isDark ? SMOKE_CONFIG.opacityDark : SMOKE_CONFIG.opacityLight;

      for (let i = puffs.length - 1; i >= 0; i--) {
        const puff = puffs[i];
        const age = (now - puff.born) / puff.life;

        if (age >= 1) {
          puffs.splice(i, 1);
          continue;
        }

        puff.vx += Math.sin(now * 0.0008 + puff.seed) * SMOKE_CONFIG.turbulence * frames;
        puff.vy +=
          (Math.cos(now * 0.0007 + puff.seed * 1.7) * SMOKE_CONFIG.turbulence + SMOKE_CONFIG.rise) *
          frames;
        puff.vx *= SMOKE_CONFIG.damping;
        puff.vy *= SMOKE_CONFIG.damping;
        puff.x += puff.vx * frames;
        puff.y += puff.vy * frames;
        puff.rotation += puff.spin * frames;

        const fadeIn = Math.min(1, age / 0.18);
        const fadeOut = 1 - Math.pow(Math.max(0, (age - 0.18) / 0.82), 1.6);
        const size = puff.size * (1 + SMOKE_CONFIG.growth * age);

        ctx.save();
        ctx.translate(puff.x, puff.y);
        ctx.rotate(puff.rotation);
        ctx.globalAlpha = peak * fadeIn * Math.max(0, fadeOut);
        ctx.drawImage(sprites[puff.sprite], -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerleave", handleLeave);
    window.addEventListener("blur", handleLeave);
    window.addEventListener("resize", resize);
    // Shares the ticker that already drives Lenis rather than opening a second
    // rAF loop.
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
      puffs.length = 0;
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  // z-0 with pointer-events-none: above the body background, below the page
  // content, which SmoothScroll wraps in a z-10 layer. Fixed so it survives
  // scrolling, and a leaf node so its filter cannot trap anything else.
  //
  // h-full w-full is not redundant with inset-0: a canvas is a replaced element,
  // so it keeps its intrinsic attribute size and the insets alone leave it at
  // whatever the backing store happens to be.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ filter: `blur(${SMOKE_CONFIG.blurPx}px)` }}
    />
  );
}
