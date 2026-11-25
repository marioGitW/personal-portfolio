import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

// Every number behind the hologram. Lengths are CSS pixels and times are seconds, unless a
// comment says otherwise. Shares of rx are of the portal's own radius, and shares of the figure
// are of his height.
const HOLOGRAM = {
  // Written by scripts/build-character-cutout.mjs: the figure's luminance and silhouette.
  src: "/about/character-cutout.png",
  // How far off screen the stage still is when the cutout is fetched.
  loadMargin: "800px",
  // The longest the reveal waits for it.
  loadPatienceMs: 1500,
  maxDpr: { mouse: 2, touch: 1.5 },
  // The figure's layers are drawn at least this fine. It floats by parts of a pixel, and at 1x
  // a layer with only one pixel to a dot's edge goes soft and sharp again as it moves.
  minLayerScale: 2,
  resizeDebounceMs: 150,
  // The longest step the loop takes. After a pause the gap can be minutes.
  maxStep: 0.05,
  // Shares of the figure: the whole stage, and the part of it under the portal's middle. The
  // canvas is exactly the stage, so this is all the room the glow and the particles have.
  // .about-stage in the stylesheet is this backwards.
  stage: { height: 1.22, foot: 0.14 },
  // Lengths on and around the pad are for a portal this wide. A smaller one shrinks them.
  fit: { rx: 150, min: 0.6 },
  halftone: {
    cell: 3,
    // As many rows to a phone's shorter figure as he had.
    narrowCell: 3.3,
    narrowBelow: 768,
    minAlpha: 0.5,
    dot: 0.56,
    // Each theme's tone, as clamp((from - L) / span) ^ power, then r = dot * (base + gain * √d).
    // Light prints darkness and dark prints brightness, so neither reads as a negative.
    light: { sign: -1, from: 238, span: 200, power: 1.25, base: 0.2, gain: 0.8 },
    dark: { sign: 1, from: 25, span: 200, power: 1.1, base: 0.36, gain: 0.64 },
    scanRow: { every: 3, alpha: 0.72 },
    bands: [
      { at: 0.31, rows: 2, shift: 4 },
      { at: 0.66, rows: 1, shift: -5 },
    ],
    feet: { from: 0.84, share: 0.5, rise: [4, 40], alpha: 0.55, accent: 0.15 },
    fragments: { share: 0.03, size: [2, 6], reach: [8, 54], alpha: [0.35, 0.8], accent: 0.28 },
    // Room around the figure in its layers, for the fragments.
    margin: 64,
  },
  portal: {
    rx: 0.33,
    ry: 0.2,
    // How far below the portal's middle the soles come, as a share of ry.
    stand: 0.3,
    rim: 11,
    rimDashes: { count: 13, step: 12.5, size: [7, 2], alpha: 0.9 },
    ticks: { count: 36, from: 0.93, to: 0.985, alpha: 0.45 },
    dashed: { at: 0.84, width: 1.4, dash: [7, 6] },
    segmented: { at: 0.66, width: 2.4, dash: [46, 16, 12, 16] },
    cores: [
      { at: 0.46, alpha: 0.2, edge: 0.45 },
      { at: 0.24, alpha: 0.32, edge: 0 },
    ],
    glow: { alpha: 0.42, rx: 1.47, squash: 0.275 },
    beam: { alpha: 0.17, height: 330, foot: 0.9, head: 0.62 },
    lap: 20,
  },
  trails: {
    count: 14,
    block: [2, 3],
    gap: 2,
    height: [50, 230],
    speed: [16, 44],
    life: [3.5, 7],
    alpha: 0.6,
    // Runs of this many blocks are missing, and single ones, at these odds.
    run: 5,
    runGap: 0.24,
    blockGap: 0.12,
    // Blocks before a trail's gaps repeat. Whole runs of them.
    pattern: 100,
  },
  // Never more than max of them, idle of those at rest, and half as many of both on a narrow
  // screen. spawn is how many a second, at rest and under the pointer.
  particles: {
    max: 140,
    idle: 48,
    halfBelow: 1024,
    spawn: [12, 96],
    size: [1.5, 4],
    speed: [22, 62],
    hoverSpeed: 1.5,
    drift: 5,
    rise: 400,
    accent: 0.4,
    alpha: [0.45, 0.95],
    // Kept between them and the top of the canvas.
    clear: 8,
    fadeIn: 14,
  },
  float: { distance: 4, period: 8 },
  glitch: { every: [6, 9], shift: [3, 5], rows: [2, 5], duration: 0.12 },
  scan: {
    duration: 0.9,
    // How long one takes to go once the pointer has.
    fade: 0.15,
    // A second one can't start this soon after the last.
    guardMs: 250,
    line: 1.5,
    cap: 5,
    overhang: 14,
    haze: 44,
    hazeAlpha: 0.14,
    band: 26,
    jitter: 3,
    jitterMs: 50,
    // Rows on either side the line's ends are averaged over, so they don't twitch.
    easeRows: 5,
  },
  // What the pointer does. ease is the time constant its intensity follows it with.
  hover: { ease: 0.12, lift: -6, spin: 3, glow: 1.7, trail: 1.4 },
  seed: 7,
} as const;

// He comes up out of the portal once, along one timeline of this length. About.tsx puts the
// panel and the connector on it.
export const REVEAL = {
  duration: 2,
  // The line is half way up here, as its ease is symmetrical.
  panelAt: 0.95,
  lockAt: 1.65,
  boot: 0.35,
  build: { from: 0.25, to: 1.65 },
  // The portal before any of it.
  dim: 0.6,
  coreFlash: 1.6,
  glowPeak: 1.3,
  // How far past the top of the head the line goes.
  overshoot: 8,
  // Dots form over this much below the line, each in its own time: grow, after up to delay.
  // Where the line is quicker than that, they keep to the band instead.
  band: 24,
  dot: { grow: 0.12, delay: 0.08 },
  jitter: 2,
  overhang: 12,
  haze: 40,
  hazeAlpha: 0.12,
  flashFrames: 2,
  flickerAt: 1.72,
  trail: 1.6,
  sparks: {
    max: 80,
    rate: 120,
    size: [2, 4],
    above: [10, 60],
    rise: [20, 40],
    life: [0.3, 0.55],
    accent: 0.5,
  },
  // All there is of it under reduced motion.
  fade: 0.3,
} as const;

type Rgb = [number, number, number];
type Token = "surface" | "border" | "foreground" | "accent";

// ink and accent are what the loop draws with, made once so that it doesn't have to.
type Palette = {
  dark: boolean;
  ink: string;
  accent: string;
  css: (token: Token, alpha?: number) => string;
};

type Geometry = {
  width: number;
  height: number;
  dpr: number;
  figureHeight: number;
  portal: { cx: number; cy: number; rx: number; ry: number };
  // What lengths on and around the pad are scaled by.
  fit: number;
  // How far particles rise, which never takes them out of the canvas.
  rise: number;
  amounts: { max: number; idle: number };
};

type Grid = {
  cell: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
  luminance: Uint8Array;
  solid: Uint8Array;
  // The middle of the feet, from the figure's left.
  feet: number;
};

// A picture drawn once, and where on the stage it goes.
type Layer = { canvas: HTMLCanvasElement; x: number; y: number; width: number; height: number };

type Figure = {
  scale: number;
  // The layers' size, margins and all.
  width: number;
  height: number;
  // His dots and what has come off them, which the reveal brings in apart, and both as one.
  dots: HTMLCanvasElement;
  debris: HTMLCanvasElement;
  whole: HTMLCanvasElement;
  // Every dot again: its middle, and the side of the square with its area. A row's are those
  // from rowStart[row] up to the next row's.
  rowY: Float32Array;
  rowStart: Uint32Array;
  dotX: Float32Array;
  dotSide: Float32Array;
  // Both edges of each row of dots, eased across rows for the lines to follow.
  left: Float32Array;
  right: Float32Array;
};

type Ring = {
  rx: number;
  ry: number;
  perimeter: number;
  dash: number[];
  width: number;
  turn: 1 | -1;
  accent: boolean;
  // Half of it each, from the left round to the right and back.
  far: Path2D;
  near: Path2D;
};

/** Not there yet, on his way up, and there for good. */
type HologramPhase = "waiting" | "building" | "standing";

export type Hologram = {
  /** The pointer is over the panel. The stage's own is listened to here. */
  hoverPanel: (over: boolean) => void;
  /** One sweep on its own, for touch. */
  scan: () => void;
  /** Fetches the figure if nothing has yet. Resolves once it can be drawn, or clearly can't. */
  ready: () => Promise<void>;
  /** Puts the figure and the portal on the reveal's timeline. */
  reveal: (timeline: gsap.core.Timeline) => void;
  setPhase: (phase: HologramPhase) => void;
  /** Reduced motion's whole reveal. */
  appear: () => void;
  destroy: () => void;
};

type HologramOptions = {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Told when the panel and the connector should react too. */
  onActiveChange: (active: boolean) => void;
};

const TAU = Math.PI * 2;
const NO_DASH: number[] = [];

/** Where the portal sits in a stage of this size. The connector reads it too. */
export function hologramLayout(width: number, height: number) {
  const { stage, portal } = HOLOGRAM;
  const figureHeight = height / stage.height;
  const rx = figureHeight * portal.rx;
  return {
    figureHeight,
    portal: { cx: width / 2, cy: height - figureHeight * stage.foot, rx, ry: rx * portal.ry },
  };
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function mix(from: number, to: number, share: number) {
  return from + (to - from) * share;
}

function between(range: readonly number[], share = Math.random()) {
  return mix(range[0], range[1], share);
}

function easeInOutCubic(share: number) {
  return share < 0.5 ? 4 * share ** 3 : 1 - (2 - 2 * share) ** 3 / 2;
}

// Seeded, so the figure comes out the same on every theme and resize.
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// A repeatable number in 0-1 for a pair of whole ones, with no state to carry.
function hash(a: number, b: number) {
  let value = Math.imul(a, 374761393) + Math.imul(b, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

// Colours always come from the tokens, whatever they are at the time.
function readPalette(): Palette {
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const styles = getComputedStyle(document.documentElement);
  const cache = new Map<Token, Rgb>();

  const read = (token: Token): Rgb => {
    let rgb = cache.get(token);
    if (!rgb) {
      rgb = [0, 0, 0];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = styles.getPropertyValue(`--${token}`).trim();
        probe.fillRect(0, 0, 1, 1);
        const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [red, green, blue];
      }
      cache.set(token, rgb);
    }
    return rgb;
  };
  const css = (token: Token, alpha = 1) => `rgb(${read(token).join(" ")} / ${alpha})`;

  return { dark: isDark(), ink: css("foreground"), accent: css("accent"), css };
}

// exact keeps the canvas off the GPU, whose circles a few pixels wide come out lopsided. It is
// drawn into once, so it doesn't cost the animation anything.
function createCanvas(width: number, height: number, scale: number, exact = false) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(Math.ceil(width * scale), 1);
  canvas.height = Math.max(Math.ceil(height * scale), 1);
  const context = canvas.getContext("2d", { willReadFrequently: exact });
  context?.scale(scale, scale);
  return { canvas, context };
}

// A layer over this box of the stage, grown to whole device pixels so it is drawn unscaled.
function bake(
  dpr: number,
  box: { left: number; top: number; right: number; bottom: number },
  paint: (context: CanvasRenderingContext2D) => void,
): Layer | null {
  const x = Math.floor(box.left * dpr) / dpr;
  const y = Math.floor(box.top * dpr) / dpr;
  const { canvas, context } = createCanvas(box.right - x, box.bottom - y, dpr);
  if (!context) {
    return null;
  }
  context.translate(-x, -y);
  paint(context);
  return { canvas, x, y, width: canvas.width / dpr, height: canvas.height / dpr };
}

function sampleGrid(image: HTMLImageElement, geometry: Geometry): Grid | null {
  const { halftone } = HOLOGRAM;
  const { dpr, figureHeight } = geometry;
  const wanted = window.innerWidth < halftone.narrowBelow ? halftone.narrowCell : halftone.cell;
  // Whole device pixels, or the rows beat against the screen's own grid.
  const cell = Math.max(Math.round(wanted * dpr), 1) / dpr;
  const rows = Math.round(figureHeight / cell);
  const columns = Math.round((figureHeight * image.naturalWidth) / image.naturalHeight / cell);
  if (rows < 1 || columns < 1) {
    return null;
  }

  const sampler = document.createElement("canvas");
  sampler.width = image.naturalWidth;
  sampler.height = image.naturalHeight;
  const context = sampler.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, sampler.width, sampler.height);

  // A plain average over each cell. Letting drawImage shrink it blurs past the cell, and the
  // eyes are only two cells tall.
  const averageOf = (column: number, row: number) => {
    const fromX = Math.floor((column * sampler.width) / columns);
    const toX = Math.max(Math.floor(((column + 1) * sampler.width) / columns), fromX + 1);
    const fromY = Math.floor((row * sampler.height) / rows);
    const toY = Math.max(Math.floor(((row + 1) * sampler.height) / rows), fromY + 1);
    let light = 0;
    let alpha = 0;
    for (let y = fromY; y < toY; y++) {
      for (let x = fromX; x < toX; x++) {
        const at = (y * sampler.width + x) * 4;
        light += data[at] * data[at + 3];
        alpha += data[at + 3];
      }
    }
    return {
      alpha: alpha / ((toX - fromX) * (toY - fromY)),
      light: alpha > 0 ? light / alpha : 0,
    };
  };

  const count = columns * rows;
  const luminance = new Uint8Array(count);
  const solid = new Uint8Array(count);
  // The soles are the last few rows. The head leans one way and an elbow sticks out the
  // other, so the figure's own middle isn't over its feet.
  const soles = Math.floor(rows * 0.95);
  let feetLeft = columns * cell;
  let feetRight = 0;
  for (let index = 0; index < count; index++) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const { alpha, light } = averageOf(column, row);
    if (alpha < halftone.minAlpha * 255) {
      continue;
    }
    solid[index] = 1;
    luminance[index] = light;
    if (row >= soles) {
      feetLeft = Math.min(feetLeft, column * cell);
      feetRight = Math.max(feetRight, (column + 1) * cell);
    }
  }

  return {
    cell,
    columns,
    rows,
    width: columns * cell,
    height: rows * cell,
    luminance,
    solid,
    feet: feetRight > feetLeft ? (feetLeft + feetRight) / 2 : (columns * cell) / 2,
  };
}

// The halftone itself. Once per theme and size, and never while animating.
function renderFigure(grid: Grid, palette: Palette, { dpr, fit }: Geometry): Figure | null {
  const { halftone, minLayerScale } = HOLOGRAM;
  const scale = Math.max(dpr, minLayerScale);
  const { cell, columns, rows, luminance, solid } = grid;
  const { margin } = halftone;
  const width = grid.width + margin * 2;
  const height = grid.height + margin * 2;
  const dots = createCanvas(width, height, scale, true);
  const debris = createCanvas(width, height, scale);
  const whole = createCanvas(width, height, scale);
  if (!dots.context || !debris.context || !whole.context) {
    return null;
  }
  dots.context.translate(margin, margin);
  debris.context.translate(margin, margin);

  const random = seeded(HOLOGRAM.seed);
  const tone = palette.dark ? halftone.dark : halftone.light;
  const { ink, accent } = palette;

  const radiusOf = (index: number) => {
    const share = clamp01((tone.sign * (luminance[index] - tone.from)) / tone.span) ** tone.power;
    return cell * halftone.dot * (tone.base + tone.gain * Math.sqrt(share));
  };

  const isSolid = (column: number, row: number) =>
    column >= 0 &&
    column < columns &&
    row >= 0 &&
    row < rows &&
    solid[row * columns + column] === 1;

  const square = (x: number, y: number, size: number, isAccent: boolean, alpha: number) => {
    const context = debris.context;
    if (!context) {
      return;
    }
    context.globalAlpha = alpha;
    context.fillStyle = isAccent ? accent : ink;
    context.fillRect(x - size / 2, y - size / 2, size, size);
  };

  const { feet, fragments, scanRow } = halftone;
  const rowY = new Float32Array(rows);
  const rowStart = new Uint32Array(rows + 1);
  const dotX: number[] = [];
  const dotSide: number[] = [];
  const leftEdges: (number | null)[] = [];
  const rightEdges: (number | null)[] = [];

  for (let row = 0; row < rows; row++) {
    const band = halftone.bands.find(({ at, rows: tall }) => {
      const first = Math.round(at * rows);
      return row >= first && row < first + tall;
    });
    const shift = band?.shift ?? 0;
    const y = (row + 0.5) * cell;
    const dissolving = clamp01((row / rows - feet.from) / (1 - feet.from)) * feet.share;
    let left: number | null = null;
    let right: number | null = null;
    rowY[row] = y;
    rowStart[row] = dotX.length;
    dots.context.fillStyle = ink;
    dots.context.globalAlpha = row % scanRow.every === scanRow.every - 1 ? scanRow.alpha : 1;

    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      if (!solid[index]) {
        continue;
      }
      const x = (column + 0.5) * cell + shift;

      if (random() < dissolving) {
        const rise = between(feet.rise, random()) * fit;
        square(x, y - rise, cell + 1, random() < feet.accent, feet.alpha);
      } else {
        const radius = radiusOf(index);
        dotX.push(x);
        dotSide.push(radius * Math.sqrt(Math.PI));
        left = Math.min(left ?? Infinity, x - radius);
        right = Math.max(right ?? -Infinity, x + radius);
        dots.context.beginPath();
        dots.context.arc(x, y, radius, 0, TAU);
        dots.context.fill();
      }

      const onEdge =
        !isSolid(column - 1, row) ||
        !isSolid(column + 1, row) ||
        !isSolid(column, row - 1) ||
        !isSolid(column, row + 1);
      if (onEdge && random() < fragments.share) {
        // Away from whatever is solid nearby.
        let outX = 0;
        let outY = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (!isSolid(column + dx, row + dy)) {
              outX += dx;
              outY += dy;
            }
          }
        }
        // Off the soles they would land under the portal.
        if (dissolving > 0) {
          outY = Math.min(outY, 0);
        }
        const length = Math.hypot(outX, outY) || 1;
        const reach = between(fragments.reach, random()) * fit;
        square(
          x + (outX / length) * reach,
          y + (outY / length) * reach,
          between(fragments.size, random()),
          random() < fragments.accent,
          between(fragments.alpha, random()),
        );
      }
    }

    leftEdges.push(left);
    rightEdges.push(right);
  }
  rowStart[rows] = dotX.length;

  for (const part of [dots.canvas, debris.canvas]) {
    whole.context.drawImage(part, 0, 0, part.width / scale, part.height / scale);
  }

  return {
    scale,
    width: whole.canvas.width / scale,
    height: whole.canvas.height / scale,
    dots: dots.canvas,
    debris: debris.canvas,
    whole: whole.canvas,
    rowY,
    rowStart,
    dotX: Float32Array.from(dotX),
    dotSide: Float32Array.from(dotSide),
    left: easeEdge(leftEdges, grid.feet),
    right: easeEdge(rightEdges, grid.feet),
  };
}

// One edge of the dots on each row, averaged over the rows around it.
function easeEdge(edges: (number | null)[], fallback: number) {
  const { easeRows } = HOLOGRAM.scan;
  return Float32Array.from(edges, (_, row) => {
    const near = edges
      .slice(Math.max(row - easeRows, 0), row + easeRows + 1)
      .filter((edge) => edge !== null);
    return near.length > 0 ? near.reduce((sum, edge) => sum + edge, 0) / near.length : fallback;
  });
}

// An edge of the silhouette at this height.
function edgeAt(edges: Float32Array, y: number, cell: number) {
  const row = Math.min(Math.max(y / cell, 0), edges.length - 1);
  const above = Math.floor(row);
  const below = Math.min(above + 1, edges.length - 1);
  return mix(edges[above], edges[below], row - above);
}

// Around an ellipse, whole repeats of the dash fit only if it is stretched a little.
function fitDash(dash: readonly number[], rx: number, ry: number) {
  const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const period = dash.reduce((sum, length) => sum + length, 0);
  const scale = perimeter / (Math.max(Math.round(perimeter / period), 1) * period);
  return { perimeter, dash: dash.map((length) => length * scale) };
}

export function createHologram({
  stage,
  canvas,
  onActiveChange,
}: HologramOptions): Hologram | null {
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const reduced = prefersReducedMotion();
  const touch = window.matchMedia("(hover: none), (pointer: coarse)");
  const image = new Image();

  // Everything the loop draws is one of these, some rectangles, or the two rings. Baked per theme
  // and size: gradients drawn live compile their shaders on first use, which on the first hover
  // was half a second of dropped frames.
  let geometry: Geometry | null = null;
  let palette = readPalette();
  let grid: Grid | null = null;
  let figure: Figure | null = null;
  let pad: Layer | null = null;
  // The same with its cores on, for once they have stopped flashing.
  let padLit: Layer | null = null;
  // The glow and the beam, at their brightest.
  let light: Layer | null = null;
  let haze: HTMLCanvasElement | null = null;
  let rings: Ring[] = [];

  let onScreen = false;
  let loading = false;
  let loaded = false;
  let phase: HologramPhase = reduced ? "standing" : "waiting";
  let timeline: gsap.core.Timeline | null = null;
  let destroyed = false;
  let frame = 0;
  let last = 0;
  let resizeTimer = 0;
  let patience = 0;

  // The reveal's, which GSAP writes: clock is the time on its timeline, and the rest are shares
  // of each part's normal self.
  const state = {
    clock: 0,
    pad: reduced ? 1 : REVEAL.dim,
    rings: reduced ? 1 : 0,
    core: 1,
    glow: reduced ? 1 : 0,
    flow: reduced ? 1 : 0,
    trail: reduced ? 1 : REVEAL.trail,
    debris: reduced ? 1 : 0,
    build: reduced ? 1 : 0,
    line: 0,
    figure: reduced ? 0 : 1,
  };
  let flash = 0;

  // The loop's own. intensity eases to whatever the pointer has set the target to, and all of
  // the hover but the sweep is worked out from it. In an object, as a number a closure writes to
  // is a new one on the heap each time.
  const motion = { step: 0, target: 0, intensity: 0, float: 0, rings: 0 };
  let overStage = false;
  let overPanel = false;
  let lastPointer = "mouse";
  const sweep = { running: false, leaving: false, at: 0, strength: 0, startedAt: -Infinity };
  const glitch = { left: 0, wait: between(HOLOGRAM.glitch.every), row: 0, rows: 0, shift: 0 };

  // --- Pools -------------------------------------------------------------

  // Fixed, and written over in place, so that animating allocates nothing.

  const POOL = HOLOGRAM.particles.max;
  const particles = {
    x: new Float32Array(POOL),
    y: new Float32Array(POOL),
    size: new Float32Array(POOL),
    speed: new Float32Array(POOL),
    phase: new Float32Array(POOL),
    alpha: new Float32Array(POOL),
    // How far up it is, or -1 for one that isn't there.
    risen: new Float32Array(POOL).fill(-1),
    accent: new Uint8Array(POOL),
    // Here because of the pointer, and gone when the intensity is.
    extra: new Uint8Array(POOL),
    debt: 0,
  };

  const SPARKS = REVEAL.sparks.max;
  const sparks = {
    x: new Float32Array(SPARKS),
    y: new Float32Array(SPARKS),
    size: new Float32Array(SPARKS),
    rise: new Float32Array(SPARKS),
    age: new Float32Array(SPARKS),
    // 0 for one that isn't there.
    life: new Float32Array(SPARKS),
    accent: new Uint8Array(SPARKS),
    debt: 0,
  };

  // Every other one is in the accent.
  const { count: TRAILS, pattern: PATTERN } = HOLOGRAM.trails;
  const trails = {
    x: new Float32Array(TRAILS),
    depth: new Float32Array(TRAILS),
    height: new Float32Array(TRAILS),
    speed: new Float32Array(TRAILS),
    life: new Float32Array(TRAILS),
    age: new Float32Array(TRAILS),
    // A pattern's worth of blocks each, and 1 for one that is missing.
    gaps: new Uint8Array(TRAILS * PATTERN),
  };

  // Places are shares of the portal's radii, inside the pad.
  const spawnTrail = (slot: number) => {
    const { height, speed, life, run, runGap, blockGap } = HOLOGRAM.trails;
    const angle = Math.random() * TAU;
    const radius = Math.sqrt(Math.random()) * 0.88;
    trails.x[slot] = Math.cos(angle) * radius;
    trails.depth[slot] = Math.sin(angle) * radius;
    trails.height[slot] = between(height);
    trails.speed[slot] = between(speed);
    trails.life[slot] = between(life);
    trails.age[slot] = 0;
    let missing = false;
    for (let block = 0; block < PATTERN; block++) {
      if (block % run === 0) {
        missing = Math.random() < runGap;
      }
      trails.gaps[slot * PATTERN + block] = missing || Math.random() < blockGap ? 1 : 0;
    }
  };

  // Already under way, and they grow out of the pad with the rest of the reveal.
  for (let slot = 0; slot < TRAILS; slot++) {
    spawnTrail(slot);
    trails.age[slot] = trails.life[slot] * (reduced ? 0.5 : Math.random());
  }

  const spawnParticle = (extra: boolean) => {
    const slot = particles.risen.indexOf(-1);
    if (slot < 0) {
      return;
    }
    const { size, speed, hoverSpeed, accent, alpha } = HOLOGRAM.particles;
    const angle = Math.random() * TAU;
    const radius = Math.sqrt(Math.random()) * 0.9;
    particles.x[slot] = Math.cos(angle) * radius;
    particles.y[slot] = Math.sin(angle) * radius;
    particles.size[slot] = between(size);
    particles.speed[slot] = between(speed) * (extra ? hoverSpeed : 1);
    particles.phase[slot] = Math.random() * TAU;
    particles.alpha[slot] = between(alpha);
    particles.risen[slot] = 0;
    particles.accent[slot] = Math.random() < accent ? 1 : 0;
    particles.extra[slot] = extra ? 1 : 0;
  };

  // --- Motion ------------------------------------------------------------

  const advanceParticles = ({ rise, amounts }: Geometry) => {
    const { spawn } = HOLOGRAM.particles;
    const { step, intensity } = motion;
    let resting = 0;
    let extras = 0;
    for (let slot = 0; slot < POOL; slot++) {
      if (particles.risen[slot] < 0) {
        continue;
      }
      const extra = particles.extra[slot] === 1;
      particles.risen[slot] += particles.speed[slot] * step;
      if (particles.risen[slot] > rise || (extra && intensity < 0.01)) {
        particles.risen[slot] = -1;
      } else if (extra) {
        extras += 1;
      } else {
        resting += 1;
      }
    }

    const wanted = (amounts.max - amounts.idle) * intensity;
    particles.debt += mix(spawn[0], spawn[1], intensity) * (amounts.max / POOL) * step;
    for (; particles.debt >= 1; particles.debt -= 1) {
      if (resting < amounts.idle) {
        spawnParticle(false);
        resting += 1;
      } else if (extras < wanted) {
        spawnParticle(true);
        extras += 1;
      }
    }
  };

  const buildLine = (height: number) => height - state.build * (height + REVEAL.overshoot);

  const advanceSparks = () => {
    for (let slot = 0; slot < SPARKS; slot++) {
      if (sparks.life[slot] > 0) {
        sparks.age[slot] += motion.step;
        if (sparks.age[slot] > sparks.life[slot]) {
          sparks.life[slot] = 0;
        }
      }
    }
    if (phase !== "building" || state.build <= 0 || state.build >= 1 || !grid || !figure) {
      sparks.debt = 0;
      return;
    }
    const { rate, size, above, rise, life, accent } = REVEAL.sparks;
    for (sparks.debt += rate * motion.step; sparks.debt >= 1; sparks.debt -= 1) {
      const slot = sparks.life.indexOf(0);
      if (slot < 0) {
        continue;
      }
      const y = buildLine(grid.height) - between(above);
      const left = edgeAt(figure.left, y, grid.cell);
      sparks.x[slot] = mix(left, edgeAt(figure.right, y, grid.cell), Math.random());
      sparks.y[slot] = y;
      sparks.size[slot] = between(size);
      sparks.rise[slot] = between(rise);
      sparks.life[slot] = between(life);
      sparks.age[slot] = 0;
      sparks.accent[slot] = Math.random() < accent ? 1 : 0;
    }
  };

  const advanceSweep = () => {
    if (!sweep.running) {
      return;
    }
    sweep.at += motion.step / HOLOGRAM.scan.duration;
    if (sweep.leaving) {
      sweep.strength -= motion.step / HOLOGRAM.scan.fade;
    }
    if (sweep.at >= 1 || sweep.strength <= 0) {
      sweep.running = false;
    }
  };

  const startGlitch = () => {
    const { shift, rows, duration } = HOLOGRAM.glitch;
    glitch.rows = Math.round(between(rows));
    glitch.row = Math.floor(Math.random() * Math.max((grid?.rows ?? 0) - glitch.rows, 1));
    glitch.shift = between(shift) * (Math.random() < 0.5 ? -1 : 1);
    glitch.left = duration;
  };

  const advanceGlitch = () => {
    glitch.left = Math.max(glitch.left - motion.step, 0);
    if (phase !== "standing") {
      return;
    }
    glitch.wait -= motion.step;
    if (glitch.wait <= 0) {
      glitch.wait = between(HOLOGRAM.glitch.every);
      startGlitch();
    }
  };

  const advanceTrails = () => {
    for (let slot = 0; slot < TRAILS; slot++) {
      trails.age[slot] += motion.step;
      if (trails.age[slot] > trails.life[slot]) {
        spawnTrail(slot);
      }
    }
  };

  // NOINLINE, here and where the loop draws: a minifier puts a function that is called in only
  // one place there as a closure, which is a new one every frame.
  const advance = () => {
    if (!geometry) {
      return;
    }
    const { ease, spin } = HOLOGRAM.hover;
    const { step, target } = motion;
    motion.intensity += (target - motion.intensity) * (1 - Math.exp(-step / ease));
    if (Math.abs(target - motion.intensity) < 0.002) {
      motion.intensity = target;
    }
    motion.rings += step * mix(1, spin, motion.intensity);
    if (phase === "standing") {
      motion.float += step;
    }
    /*#__NOINLINE__*/ advanceTrails();
    /*#__NOINLINE__*/ advanceParticles(geometry);
    /*#__NOINLINE__*/ advanceSparks();
    /*#__NOINLINE__*/ advanceSweep();
    /*#__NOINLINE__*/ advanceGlitch();
  };

  // --- Hover -------------------------------------------------------------

  // One value for the loop to ease to, whichever of the two the pointer is over.
  const syncHover = () => {
    const next = phase === "standing" && (overStage || overPanel) ? 1 : 0;
    if (next !== motion.target) {
      motion.target = next;
      onActiveChange(next === 1);
    }
  };

  const startSweep = () => {
    const now = performance.now();
    if (
      reduced ||
      phase !== "standing" ||
      sweep.running ||
      now - sweep.startedAt < HOLOGRAM.scan.guardMs
    ) {
      return;
    }
    sweep.running = true;
    sweep.leaving = false;
    sweep.at = 0;
    sweep.strength = 1;
    sweep.startedAt = now;
  };

  const handleEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      overStage = true;
      startSweep();
      syncHover();
    }
  };

  const handleLeave = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      overStage = false;
      sweep.leaving = true;
      syncHover();
    }
  };

  const handleDown = (event: PointerEvent) => {
    lastPointer = event.pointerType;
  };

  // A click rather than pointerup, which a scroll that starts here would also end in.
  const handleClick = () => {
    if (lastPointer === "touch") {
      startSweep();
    }
  };

  // --- Layers ------------------------------------------------------------

  const paintPad = (onto: CanvasRenderingContext2D, { portal, fit }: Geometry) => {
    const { rimDashes, ticks } = HOLOGRAM.portal;
    const { cx, cy, rx, ry } = portal;
    const rim = HOLOGRAM.portal.rim * fit;

    onto.fillStyle = palette.css(palette.dark ? "border" : "foreground");
    onto.beginPath();
    onto.ellipse(cx, cy + rim, rx, ry, 0, 0, Math.PI);
    onto.lineTo(cx - rx, cy);
    onto.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    onto.closePath();
    onto.fill();

    onto.fillStyle = palette.css("accent", rimDashes.alpha);
    const width = rimDashes.size[0] * fit;
    const height = rimDashes.size[1] * fit;
    for (let index = 0; index < rimDashes.count; index++) {
      const turn = (index - (rimDashes.count - 1) / 2) * rimDashes.step;
      const angle = Math.PI / 2 + (turn * Math.PI) / 180;
      onto.fillRect(
        cx + rx * Math.cos(angle) - width / 2,
        cy + ry * Math.sin(angle) + rim / 2 - height / 2,
        width,
        height,
      );
    }

    onto.fillStyle = palette.css("surface");
    onto.strokeStyle = palette.css("border");
    onto.lineWidth = 1;
    onto.beginPath();
    onto.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    onto.fill();
    onto.stroke();

    onto.strokeStyle = palette.css("foreground", ticks.alpha);
    onto.beginPath();
    for (let index = 0; index < ticks.count; index++) {
      const angle = (index / ticks.count) * TAU;
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      onto.moveTo(cx + rx * ticks.from * cos, cy + ry * ticks.from * sin);
      onto.lineTo(cx + rx * ticks.to * cos, cy + ry * ticks.to * sin);
    }
    onto.stroke();
  };

  // core is how hard they flash, which goes past 1 while the portal boots.
  const paintCores = (
    onto: CanvasRenderingContext2D,
    { portal: { cx, cy, rx, ry } }: Geometry,
    alpha: number,
    core: number,
  ) => {
    const { cores } = HOLOGRAM.portal;
    onto.lineWidth = 1;
    onto.fillStyle = palette.accent;
    onto.strokeStyle = palette.accent;
    for (let index = 0; index < cores.length; index++) {
      const { at, alpha: fill, edge } = cores[index];
      onto.beginPath();
      onto.ellipse(cx, cy, rx * at, ry * at, 0, 0, TAU);
      onto.globalAlpha = clamp01(alpha * fill * core);
      onto.fill();
      if (edge > 0) {
        onto.globalAlpha = clamp01(alpha * edge * core);
        onto.stroke();
      }
    }
    onto.globalAlpha = 1;
  };

  const paintLight = (onto: CanvasRenderingContext2D, { portal, fit }: Geometry, reach: number) => {
    const { cx, cy, rx } = portal;
    const { glow, beam } = HOLOGRAM.portal;
    const boost = HOLOGRAM.hover.glow;
    const beamTop = cy - beam.height * fit;

    const pool = onto.createRadialGradient(0, 0, 0, 0, 0, reach);
    pool.addColorStop(0, palette.css("accent", glow.alpha * boost));
    pool.addColorStop(0.5, palette.css("accent", glow.alpha * boost * 0.42));
    pool.addColorStop(1, palette.css("accent", 0));
    onto.save();
    onto.translate(cx, cy);
    onto.scale(1, glow.squash);
    onto.fillStyle = pool;
    onto.beginPath();
    onto.arc(0, 0, reach, 0, TAU);
    onto.fill();
    onto.restore();

    const rise = onto.createLinearGradient(0, cy, 0, beamTop);
    rise.addColorStop(0, palette.css("accent", beam.alpha * boost));
    rise.addColorStop(1, palette.css("accent", 0));
    onto.fillStyle = rise;
    onto.beginPath();
    onto.moveTo(cx - rx * beam.foot, cy);
    onto.lineTo(cx - rx * beam.head, beamTop);
    onto.lineTo(cx + rx * beam.head, beamTop);
    onto.lineTo(cx + rx * beam.foot, cy);
    onto.closePath();
    onto.fill();
  };

  const makeRing = (
    { portal, fit }: Geometry,
    look: { at: number; width: number; dash: readonly number[] },
    turn: Ring["turn"],
    accent: boolean,
  ): Ring => {
    const { cx, cy } = portal;
    const rx = portal.rx * look.at;
    const ry = portal.ry * look.at;
    const dash = look.dash.map((length) => length * fit);
    const far = new Path2D();
    far.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU);
    const near = new Path2D();
    near.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
    return {
      rx,
      ry,
      ...fitDash(dash, rx, ry),
      width: Math.max(look.width * fit, 1),
      turn,
      accent,
      far,
      near,
    };
  };

  const renderPortal = (at: Geometry) => {
    const { portal, dpr, fit, width } = at;
    const { cx, cy, rx, ry } = portal;
    const { rim, glow, beam, dashed, segmented } = HOLOGRAM.portal;

    const padBox = {
      left: cx - rx - 2,
      top: cy - ry - 2,
      right: cx + rx + 2,
      bottom: cy + ry + rim * fit + 2,
    };
    pad = bake(dpr, padBox, (onto) => paintPad(onto, at));
    padLit = bake(dpr, padBox, (onto) => {
      paintPad(onto, at);
      paintCores(onto, at, 1, 1);
    });

    const reach = Math.min(rx * glow.rx, width / 2);
    const lightBox = {
      left: cx - reach,
      top: cy - beam.height * fit,
      right: cx + reach,
      bottom: cy + reach * glow.squash,
    };
    light = bake(dpr, lightBox, (onto) => paintLight(onto, at, reach));

    rings = [makeRing(at, dashed, -1, false), makeRing(at, segmented, 1, true)];

    // Stretched across to whatever the scanline spans.
    const { haze: height, hazeAlpha } = HOLOGRAM.scan;
    const strip = createCanvas(4, height, dpr);
    if (strip.context) {
      const fade = strip.context.createLinearGradient(0, height, 0, 0);
      fade.addColorStop(0, palette.css("accent", hazeAlpha));
      fade.addColorStop(1, palette.css("accent", 0));
      strip.context.fillStyle = fade;
      strip.context.fillRect(0, 0, 4, height);
      haze = strip.canvas;
    }
  };

  // --- Drawing -----------------------------------------------------------

  const drawLayer = (layer: Layer | null, alpha: number) => {
    if (layer && alpha > 0) {
      context.globalAlpha = alpha;
      context.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);
    }
  };

  // Once round is a lap, and all of it is this many of its own lengths further on.
  const setRing = (ring: Ring, further: number) => {
    const turns = motion.rings / HOLOGRAM.portal.lap;
    context.setLineDash(ring.dash);
    context.lineDashOffset = ((ring.turn * turns + further) % 1) * ring.perimeter;
    context.lineWidth = ring.width;
    context.strokeStyle = ring.accent ? palette.accent : palette.ink;
  };

  // Half of both rings. The far one goes behind his feet and the near one over them, so he
  // stands in the portal, and a dash carries on from one half into the other.
  const drawRingHalves = (near: boolean) => {
    context.globalAlpha = 1;
    for (let index = 0; index < rings.length; index++) {
      const ring = rings[index];
      setRing(ring, near ? 0.25 : -0.25);
      context.stroke(near ? ring.near : ring.far);
    }
    context.setLineDash(NO_DASH);
  };

  // Dim until the reveal, which runs them round at full strength from the far side.
  const drawRingsForming = ({ portal: { cx, cy } }: Geometry) => {
    const drawn = state.rings;
    for (let index = 0; index < rings.length; index++) {
      const ring = rings[index];
      setRing(ring, (ring.turn * (1 - drawn)) / 2);
      for (let pass = 0; pass < (drawn > 0 ? 2 : 1); pass++) {
        context.globalAlpha = pass === 0 ? REVEAL.dim : 1;
        context.beginPath();
        const end = pass === 0 ? 0.75 : drawn - 0.25;
        context.ellipse(cx, cy, ring.rx, ring.ry, 0, -TAU / 4, TAU * end);
        context.stroke();
      }
    }
    context.setLineDash(NO_DASH);
    context.globalAlpha = 1;
  };

  const drawTrails = (front: boolean) => {
    if (!geometry || state.flow <= 0) {
      return;
    }
    const { cx, cy, rx, ry } = geometry.portal;
    const { block, gap } = HOLOGRAM.trails;
    const alpha = HOLOGRAM.trails.alpha * state.flow;
    const period = block[1] + gap;
    const taller =
      mix(1, HOLOGRAM.hover.trail, motion.intensity) * state.trail * state.flow * geometry.fit;
    for (let slot = 0; slot < TRAILS; slot++) {
      if (trails.depth[slot] > 0 !== front) {
        continue;
      }
      const through = trails.age[slot] / trails.life[slot];
      const presence = clamp01(Math.min(through / 0.25, (1 - through) / 0.25));
      const height = trails.height[slot] * taller * mix(0.55, 1, presence);
      const x = Math.round(cx + trails.x[slot] * rx);
      const base = cy + trails.depth[slot] * ry;
      const travel = trails.age[slot] * trails.speed[slot];
      const step = Math.floor(travel / period);
      const shift = travel - step * period;
      context.fillStyle = slot % 2 === 0 ? palette.accent : palette.ink;
      for (let at = 0; at * period < height; at++) {
        // Follows its block up the trail, so the gaps rise with it.
        const id = (((at - step) % PATTERN) + PATTERN) % PATTERN;
        const fade = 1 - (at * period + shift) / height;
        if (trails.gaps[slot * PATTERN + id] === 0 && fade > 0) {
          context.globalAlpha = alpha * presence * fade;
          context.fillRect(x, base - at * period - shift - block[1], block[0], block[1]);
        }
      }
    }
    context.globalAlpha = 1;
  };

  const drawParticles = () => {
    if (!geometry || reduced || state.flow <= 0) {
      return;
    }
    const { rise, portal } = geometry;
    const { cx, cy, rx, ry } = portal;
    const { drift, fadeIn } = HOLOGRAM.particles;
    const { intensity } = motion;
    for (let pass = 0; pass < 2; pass++) {
      context.fillStyle = pass === 1 ? palette.accent : palette.ink;
      for (let slot = 0; slot < POOL; slot++) {
        const risen = particles.risen[slot];
        if (risen < 0 || particles.accent[slot] !== pass) {
          continue;
        }
        const presence = Math.min(risen / fadeIn, 1) * (1 - risen / rise);
        const strength = particles.extra[slot] === 1 ? intensity : 1;
        context.globalAlpha = clamp01(particles.alpha[slot] * presence * state.flow * strength);
        context.fillRect(
          cx + particles.x[slot] * rx + Math.sin(particles.phase[slot] + risen / 38) * drift,
          cy + particles.y[slot] * ry - risen,
          particles.size[slot],
          particles.size[slot],
        );
      }
    }
    context.globalAlpha = 1;
  };

  // The figure's drawing is in its own coordinates, with the soles at the bottom.

  // The part of one of its layers between two heights.
  const drawSlice = (
    from: HTMLCanvasElement,
    scale: number,
    top: number,
    bottom: number,
    shift: number,
  ) => {
    const { margin } = HOLOGRAM.halftone;
    const start = Math.max((top + margin) * scale, 0);
    const tall = Math.min((bottom + margin) * scale, from.height) - start;
    if (tall > 0) {
      context.drawImage(
        from,
        0,
        start,
        from.width,
        tall,
        shift - margin,
        start / scale - margin,
        from.width / scale,
        tall / scale,
      );
    }
  };

  // One row of his dots, as squares, each pushed sideways by up to reach.
  const fillRow = (
    at: Figure,
    row: number,
    style: string,
    alpha: number,
    reach: number,
    tick: number,
  ) => {
    context.globalAlpha = alpha;
    context.fillStyle = style;
    const y = at.rowY[row];
    const end = at.rowStart[row + 1];
    for (let dot = at.rowStart[row]; dot < end; dot++) {
      const side = at.dotSide[dot];
      const nudge = (hash(dot, tick) * 2 - 1) * reach;
      context.fillRect(at.dotX[dot] + nudge - side / 2, y - side / 2, side, side);
    }
  };

  // Across the silhouette at that height, with a haze above it. The haze's layer is the scan's,
  // scaled down to whatever this one is.
  const drawScanline = (
    at: Figure,
    cell: number,
    y: number,
    overhang: number,
    tall: number,
    hazeAlpha: number,
    alpha: number,
  ) => {
    if (!haze) {
      return;
    }
    const { line, cap, hazeAlpha: baked } = HOLOGRAM.scan;
    const left = edgeAt(at.left, y, cell) - overhang;
    const right = edgeAt(at.right, y, cell) + overhang;
    context.globalAlpha = alpha * (hazeAlpha / baked);
    context.drawImage(haze, left, y - tall, right - left, tall);
    context.globalAlpha = alpha;
    context.fillStyle = palette.accent;
    context.fillRect(left, y - line / 2, right - left, line);
    context.fillRect(left - cap / 2, y - cap / 2, cap, cap);
    context.fillRect(right - cap / 2, y - cap / 2, cap, cap);
  };

  // Only the dots in the band under the line are drawn one by one, and as rectangles, which
  // batch where an image for each would not. The rest is the cached figure, in two pieces.
  const drawSweep = (now: number, { cell, rows, height }: Grid, at: Figure) => {
    const { band, jitter, jitterMs, overhang, haze: tall, hazeAlpha } = HOLOGRAM.scan;
    const { margin } = HOLOGRAM.halftone;
    const { whole, scale } = at;
    const strength = clamp01(sweep.strength);
    const line = easeInOutCubic(sweep.at) * height;
    const first = Math.max(Math.floor((line - band) / cell), 0);
    const end = Math.max(Math.min(Math.floor(line / cell), rows), first);
    context.globalAlpha = 1;
    drawSlice(whole, scale, -margin, first * cell, 0);
    drawSlice(whole, scale, end * cell, height + margin, 0);

    const tick = Math.floor(now / jitterMs);
    for (let row = first; row < end; row++) {
      // 1 at the line, easing to 0 where the dots have settled back.
      const heat = clamp01(1 - (line - at.rowY[row]) / band) * strength;
      const hot = clamp01(heat * 1.8);
      if (hot < 1) {
        context.globalAlpha = 1 - hot;
        drawSlice(whole, scale, row * cell, (row + 1) * cell, 0);
      }
      if (hot > 0) {
        fillRow(at, row, palette.accent, hot, jitter * heat, tick);
      }
    }

    const ends = clamp01(Math.min(sweep.at, 1 - sweep.at) / 0.04);
    drawScanline(at, cell, line, overhang, tall, hazeAlpha, ends * strength);
  };

  const drawStanding = (now: number, from: Grid, at: Figure, x: number, y: number, dpr: number) => {
    const { margin } = HOLOGRAM.halftone;
    const { whole, scale } = at;
    if (sweep.running) {
      context.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
      /*#__NOINLINE__*/ drawSweep(now, from, at);
    } else if (glitch.left > 0) {
      // Snapped, so the slice lines up with the rows on either side of it.
      context.setTransform(dpr, 0, 0, dpr, x * dpr, Math.round(y * dpr));
      const top = glitch.row * from.cell;
      const bottom = top + glitch.rows * from.cell;
      drawSlice(whole, scale, -margin, top, 0);
      drawSlice(whole, scale, top, bottom, glitch.shift);
      drawSlice(whole, scale, bottom, from.height + margin, 0);
    } else {
      context.globalAlpha = state.figure;
      context.drawImage(whole, x - margin, y - margin, at.width, at.height);
    }
  };

  // When the line got to y. Its ease undone rather than remembered, so any point on the timeline
  // draws the same.
  const passedAt = (y: number, height: number) => {
    const { from, to } = REVEAL.build;
    const share = clamp01((height - y) / (height + REVEAL.overshoot));
    const through = share < 0.5 ? Math.cbrt(share / 4) : 1 - Math.cbrt((1 - share) / 4);
    return mix(from, to, through);
  };

  // One row of the dots that are still coming up, in one of the two colours they are between.
  const fillFormingRow = (
    at: Figure,
    row: number,
    style: string,
    alpha: number,
    age: number,
    below: number,
    reach: number,
    tick: number,
  ) => {
    const { grow, delay } = REVEAL.dot;
    context.globalAlpha = alpha;
    context.fillStyle = style;
    const y = at.rowY[row];
    const end = at.rowStart[row + 1];
    for (let dot = at.rowStart[row]; dot < end; dot++) {
      const turn = hash(dot, 17);
      const grown = clamp01(Math.max((age - turn * delay) / grow, (below - turn * 0.4) / 0.5));
      if (grown > 0) {
        const side = at.dotSide[dot] * (1 - (1 - grown) ** 2);
        const nudge = (hash(dot, tick) * 2 - 1) * reach;
        context.fillRect(at.dotX[dot] + nudge - side / 2, y - side / 2, side, side);
      }
    }
  };

  const drawSparks = () => {
    for (let slot = 0; slot < SPARKS; slot++) {
      if (sparks.life[slot] <= 0) {
        continue;
      }
      const through = sparks.age[slot] / sparks.life[slot];
      const size = sparks.size[slot];
      context.globalAlpha = 1 - through;
      context.fillStyle = sparks.accent[slot] === 1 ? palette.accent : palette.ink;
      context.fillRect(
        sparks.x[slot] - size / 2,
        sparks.y[slot] - sparks.rise[slot] * through,
        size,
        size,
      );
    }
  };

  // He is cut off at the line. Below the band it is the cached figure, and in the band it is the
  // dots themselves, so that they can come up one by one.
  const drawForming = (now: number, { cell, rows, height }: Grid, at: Figure) => {
    if (state.build <= 0 && state.debris <= 0) {
      return;
    }
    const { margin, feet } = HOLOGRAM.halftone;
    const { band, jitter, overhang, haze: tall, hazeAlpha } = REVEAL;
    const { dots, debris, scale } = at;
    const line = buildLine(height);
    const bottom = height + margin;

    // Whole rows, by where their dots' middles are.
    const first = Math.max(Math.ceil(line / cell - 0.5), 0);
    const settledRow = Math.max(Math.ceil((line + band) / cell - 0.5), 0);
    const settled = settledRow * cell;

    context.globalAlpha = 1;
    if (glitch.left > 0) {
      const from = Math.max(glitch.row * cell, settled);
      const to = Math.max((glitch.row + glitch.rows) * cell, settled);
      drawSlice(dots, scale, settled, from, 0);
      drawSlice(dots, scale, from, to, glitch.shift);
      drawSlice(dots, scale, to, bottom, 0);
    } else {
      drawSlice(dots, scale, settled, bottom, 0);
    }

    // What has come off the feet is there before they are.
    context.globalAlpha = state.debris;
    const feetTop = rows * feet.from * cell - feet.rise[1] - cell;
    drawSlice(debris, scale, Math.min(line, feetTop), bottom, 0);

    const tick = Math.floor(now / HOLOGRAM.scan.jitterMs);
    const end = Math.min(settledRow, rows);
    for (let row = first; row < end; row++) {
      const y = at.rowY[row];
      const below = (y - line) / band;
      const age = state.clock - passedAt(y, height);
      // 1 in the accent, and 0 once it is the figure's own. By the band while the line is
      // quick, by time once it has stopped, and all of it for the frames he locks on.
      const heat = flash > 0 ? 1 : clamp01(Math.min((1 - below) / 0.6, 1 - (age - 0.2) / 0.2));
      if (heat < 1) {
        fillFormingRow(at, row, palette.ink, 1 - heat, age, below, jitter * heat, tick);
      }
      if (heat > 0) {
        fillFormingRow(at, row, palette.accent, heat, age, below, jitter * heat, tick);
      }
    }
    flash = Math.max(flash - 1, 0);

    drawSparks();
    if (state.line > 0 && state.build > 0) {
      drawScanline(at, cell, line, overhang, tall, hazeAlpha, state.line);
    }
  };

  const drawFigure = (now: number) => {
    if (!geometry || !grid || !figure) {
      return;
    }
    const { portal, dpr } = geometry;
    const { distance, period } = HOLOGRAM.float;
    const float = -distance * Math.sin((motion.float / period) * TAU);
    const x = Math.round((portal.cx - grid.feet) * dpr) / dpr;
    const soles = portal.cy + portal.ry * HOLOGRAM.portal.stand;
    const y = soles - grid.height + float + HOLOGRAM.hover.lift * motion.intensity;

    if (phase === "standing") {
      /*#__NOINLINE__*/ drawStanding(now, grid, figure, x, y, dpr);
    } else {
      context.setTransform(dpr, 0, 0, dpr, x * dpr, y * dpr);
      drawForming(now, grid, figure);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalAlpha = 1;
  };

  const draw = (now: number) => {
    if (!geometry) {
      return;
    }
    const { dpr } = geometry;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { glow } = HOLOGRAM.hover;
    drawLayer(light, clamp01((state.glow * mix(1, glow, motion.intensity)) / glow));
    if (phase === "standing") {
      drawLayer(padLit, 1);
    } else {
      drawLayer(pad, state.pad);
      paintCores(context, geometry, state.pad, state.core);
    }

    // There is nothing to stand in until they go all the way round.
    const ringed = state.rings >= 1;
    if (ringed) {
      drawRingHalves(false);
    } else {
      drawRingsForming(geometry);
    }
    drawTrails(false);
    /*#__NOINLINE__*/ drawFigure(now);
    if (ringed) {
      drawRingHalves(true);
    }
    drawTrails(true);
    /*#__NOINLINE__*/ drawParticles();
  };

  // --- Lifecycle ---------------------------------------------------------

  const running = () =>
    !reduced && !destroyed && phase !== "waiting" && onScreen && !document.hidden;

  const tick = (now: number) => {
    motion.step = Math.min(Math.max((now - last) / 1000, 0), HOLOGRAM.maxStep);
    last = now;
    /*#__NOINLINE__*/ advance();
    draw(now);
    frame = window.requestAnimationFrame(tick);
  };

  const syncLoop = () => {
    const run = running();
    if (run === frame > 0) {
      return;
    }
    if (run) {
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    } else {
      window.cancelAnimationFrame(frame);
      frame = 0;
      // Nothing is left half way through for when it starts again.
      sweep.running = false;
    }
  };

  // GSAP's clock runs on while the tab is hidden, and the reveal would be over by the time
  // anyone saw it. Carried on with from inside a tick of that clock, which is the first time
  // it has caught up.
  const handleVisibility = () => {
    if (phase === "building") {
      if (document.hidden) {
        timeline?.pause();
      } else {
        gsap.delayedCall(0, () => timeline?.resume());
      }
    }
    syncLoop();
  };

  // Repaints now when no loop is going to.
  const refresh = () => {
    if (frame === 0) {
      draw(performance.now());
    }
  };

  const setPhase = (next: HologramPhase) => {
    if (next === phase || reduced || destroyed) {
      return;
    }
    phase = next;
    syncHover();
    syncLoop();
    refresh();
  };

  const measure = (): Geometry => {
    const box = stage.getBoundingClientRect();
    // Never wider than the stage, so it can't give the page anything to scroll to.
    const width = Math.floor(box.width);
    const height = Math.floor(box.height);
    const { figureHeight, portal } = hologramLayout(width, height);
    const { fit, particles: amounts, maxDpr } = HOLOGRAM;
    const scale = Math.min(Math.max(portal.rx / fit.rx, fit.min), 1);
    const share = window.innerWidth < amounts.halfBelow ? 0.5 : 1;
    return {
      width,
      height,
      dpr: Math.min(window.devicePixelRatio || 1, touch.matches ? maxDpr.touch : maxDpr.mouse),
      figureHeight,
      portal,
      fit: scale,
      rise: Math.min(amounts.rise * scale, portal.cy - portal.ry - amounts.clear),
      amounts: { max: amounts.max * share, idle: amounts.idle * share },
    };
  };

  const renderLayers = () => {
    if (geometry) {
      renderPortal(geometry);
      figure = grid ? renderFigure(grid, palette, geometry) : null;
    }
  };

  const layout = () => {
    const next = measure();
    if (next.width === 0 || next.height === 0) {
      return;
    }
    if (
      geometry &&
      geometry.width === next.width &&
      geometry.height === next.height &&
      geometry.dpr === next.dpr &&
      geometry.amounts.max === next.amounts.max
    ) {
      return;
    }
    geometry = next;
    canvas.width = Math.round(next.width * next.dpr);
    canvas.height = Math.round(next.height * next.dpr);
    canvas.style.width = `${next.width}px`;
    canvas.style.height = `${next.height}px`;
    // Any the new size has no room for.
    particles.risen.fill(-1, next.amounts.max);
    grid = loaded ? sampleGrid(image, next) : null;
    renderLayers();
    refresh();
  };

  let markReady: () => void = () => undefined;
  const readiness = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  const load = () => {
    if (loading || destroyed) {
      return;
    }
    loading = true;
    proximity.disconnect();
    image.src = HOLOGRAM.src;
    patience = window.setTimeout(markReady, HOLOGRAM.loadPatienceMs);
    image
      .decode()
      .then(() => {
        if (destroyed) {
          return;
        }
        loaded = true;
        grid = geometry ? sampleGrid(image, geometry) : null;
        renderLayers();
        refresh();
      })
      .catch(() => {
        // The portal is drawn either way, and the canvas keeps its label.
      })
      .finally(markReady);
  };

  const scheduleLayout = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, HOLOGRAM.resizeDebounceMs);
  };
  const resize = new ResizeObserver(scheduleLayout);
  resize.observe(stage);
  // Zooming changes the pixel ratio without always changing the stage.
  window.addEventListener("resize", scheduleLayout);

  const proximity = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        load();
      }
    },
    { rootMargin: HOLOGRAM.loadMargin },
  );
  proximity.observe(stage);

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncLoop();
  });
  visibility.observe(stage);
  document.addEventListener("visibilitychange", handleVisibility);

  stage.addEventListener("pointerenter", handleEnter);
  stage.addEventListener("pointerleave", handleLeave);
  stage.addEventListener("pointerdown", handleDown);
  stage.addEventListener("click", handleClick);

  // Lenis writes to this attribute too, so only an actual change of theme counts.
  const themeChange = new MutationObserver(() => {
    if (isDark() !== palette.dark) {
      palette = readPalette();
      renderLayers();
      refresh();
    }
  });
  themeChange.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  layout();

  return {
    hoverPanel(over) {
      overPanel = over;
      syncHover();
    },

    scan: startSweep,

    ready() {
      load();
      return readiness;
    },

    reveal(onto) {
      const { duration, boot, build, lockAt, flickerAt, coreFlash, glowPeak } = REVEAL;
      timeline = onto;
      onto
        .to(state, { clock: duration, duration, ease: "none" }, 0)
        .to(state, { pad: 1, rings: 1, debris: 1, duration: boot, ease: "power1.out" }, 0)
        .to(state, { core: coreFlash, duration: boot * 0.35, ease: "power2.out" }, 0)
        .to(state, { core: 1, duration: boot * 0.65, ease: "power1.in" }, boot * 0.35)
        .to(state, { flow: 1, duration: 0.6, ease: "power2.out" }, 0)
        .to(state, { glow: glowPeak, duration: 0.5, ease: "power2.out" }, 0)
        .to(state, { glow: 1, duration: duration - 0.5, ease: "sine.inOut" }, 0.5)
        .to(state, { line: 1, duration: 0.1, ease: "none" }, build.from)
        .to(state, { build: 1, duration: build.to - build.from, ease: "power2.inOut" }, build.from)
        .to(state, { line: 0, duration: duration - lockAt, ease: "power2.in" }, lockAt)
        .to(state, { trail: 1, duration: duration - lockAt, ease: "power2.inOut" }, lockAt)
        .call(
          () => {
            flash = REVEAL.flashFrames;
          },
          undefined,
          lockAt,
        )
        .call(startGlitch, undefined, flickerAt);
    },

    setPhase,

    appear() {
      gsap.to(state, { figure: 1, duration: REVEAL.fade, ease: "none", onUpdate: refresh });
    },

    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(patience);
      window.removeEventListener("resize", scheduleLayout);
      document.removeEventListener("visibilitychange", handleVisibility);
      stage.removeEventListener("pointerenter", handleEnter);
      stage.removeEventListener("pointerleave", handleLeave);
      stage.removeEventListener("pointerdown", handleDown);
      stage.removeEventListener("click", handleClick);
      resize.disconnect();
      proximity.disconnect();
      visibility.disconnect();
      themeChange.disconnect();
      gsap.killTweensOf(state);
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
