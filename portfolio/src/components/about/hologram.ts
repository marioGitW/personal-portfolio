import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

// Every number behind the hologram. Lengths are CSS pixels and times are seconds, unless a
// comment says otherwise. Shares of rx are of the portal's own radius.
const HOLOGRAM = {
  // Written by scripts/build-character-cutout.mjs: the figure's luminance and silhouette.
  src: "/about/character-cutout.png",
  // How far off screen the stage still is when the cutout is fetched.
  loadMargin: "800px",
  // The longest the reveal waits for it.
  loadPatienceMs: 1500,
  maxDpr: 2,
  // The figure's layers are drawn at least this fine. It floats by parts of a pixel, and at 1x
  // a layer with only one pixel to a dot's edge goes soft and sharp again as it moves.
  minLayerScale: 2,
  resizeDebounceMs: 150,
  stage: {
    // Above the head, and from the portal's middle to the bottom of the stage.
    headroom: 12,
    footroom: 48,
    // The canvas reaches past the stage, for the glow and whatever drifts off the figure.
    bleed: { top: 40, bottom: 40, side: 1.55 },
  },
  halftone: {
    cell: 3,
    narrowCell: 4,
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
  },
  particles: {
    idle: 48,
    active: 120,
    size: [1.5, 4],
    speed: [22, 62],
    drift: 5,
    rise: 400,
    accent: 0.4,
    alpha: [0.45, 0.95],
    // The extra ones a hover brings leave the pad over this long, and the first ones over this.
    burst: 1.1,
    stagger: 4,
  },
  float: { distance: 4, duration: 4 },
  glitch: { every: [6, 9], shift: [3, 5], rows: [2, 5], duration: 0.12 },
  scan: {
    duration: 0.9,
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
  active: {
    lift: -6,
    enter: 0.4,
    leave: 0.5,
    spin: 3,
    glow: 1.7,
    trail: 1.4,
  },
  seed: 7,
} as const;

// He comes up out of the portal as the section scrolls in, along one timeline of this length.
// About.tsx puts the panel and the connector on it.
export const REVEAL = {
  duration: 2,
  // How fast it runs backwards.
  reverse: 1.6,
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
type Token = "background" | "surface" | "border" | "foreground" | "muted" | "accent";
type Palette = { dark: boolean; css: (token: Token, alpha?: number) => string };

type Geometry = {
  width: number;
  height: number;
  dpr: number;
  // The canvas's box, relative to the stage.
  left: number;
  top: number;
  canvasWidth: number;
  canvasHeight: number;
  figureHeight: number;
  portal: { cx: number; cy: number; rx: number; ry: number };
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

// x and y are each dot's middle.
type DotRow = { y: number; x: number[]; r: number[] };

type Layers = {
  scale: number;
  // The figure, then what has come off it. Apart, so the sweep can cut its band out of the
  // figure alone.
  dots: HTMLCanvasElement;
  debris: HTMLCanvasElement;
  // The same dots in the accent. The sweep cuts single dots out of both by where dotRows says
  // they are: a path for each, every frame, stalls the GPU.
  hot: HTMLCanvasElement;
  dotRows: DotRow[];
  // Both edges of each row of dots, eased across rows for the lines to follow.
  left: Float32Array;
  right: Float32Array;
};

type Trail = {
  x: number;
  depth: number;
  height: number;
  speed: number;
  life: number;
  age: number;
  accent: boolean;
  seed: number;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  alpha: number;
  accent: boolean;
  risen: number;
  delay: number;
};

type Spark = {
  x: number;
  y: number;
  size: number;
  rise: number;
  life: number;
  age: number;
  accent: boolean;
};

/** Not there yet, on his way up, there, and on his way back down. */
export type HologramPhase = "waiting" | "building" | "standing" | "sinking";

export type Hologram = {
  /** The pointer is over the hologram or the panel. Ignored unless he is standing. */
  enter: () => void;
  leave: () => void;
  /** One sweep on its own, for touch. */
  scan: () => void;
  /** Resolves once the figure can be drawn, or it is clear that it can't. */
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

/** Where the portal sits in a stage of this size. The connector reads it too. */
export function hologramLayout(width: number, height: number) {
  const { headroom, footroom } = HOLOGRAM.stage;
  const { rx: rxShare, ry: ryShare, stand } = HOLOGRAM.portal;
  // The figure runs from under the headroom to just past the portal's middle, and the
  // portal's own size depends on the figure's, so this is that sum solved for the figure.
  const figureHeight = Math.max(
    (height - headroom - footroom) / (1 - stand * rxShare * ryShare),
    0,
  );
  const rx = figureHeight * rxShare;
  return {
    figureHeight,
    portal: { cx: width / 2, cy: height - footroom, rx, ry: rx * ryShare },
  };
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function mix(from: number, to: number, share: number) {
  return from + (to - from) * share;
}

function between([min, max]: readonly [number, number] | readonly number[], share = Math.random()) {
  return mix(min, max, share);
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

// A repeatable number in 0-1 for a pair, with no state to carry.
function hash(a: number, b: number) {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return value - Math.floor(value);
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

  return {
    dark: isDark(),
    css: (token, alpha = 1) => `rgb(${read(token).join(" ")} / ${alpha})`,
  };
}

// exact keeps the layer off the GPU, whose circles a few pixels wide come out lopsided. It is
// drawn into once, so it doesn't cost the animation anything.
function createLayer(width: number, height: number, dpr: number, exact = false) {
  const layer = document.createElement("canvas");
  layer.width = Math.max(Math.ceil(width * dpr), 1);
  layer.height = Math.max(Math.ceil(height * dpr), 1);
  const context = layer.getContext("2d", { willReadFrequently: exact });
  context?.scale(dpr, dpr);
  return { layer, context };
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
function renderFigure(grid: Grid, palette: Palette, dpr: number): Layers | null {
  const { halftone, minLayerScale } = HOLOGRAM;
  const scale = Math.max(dpr, minLayerScale);
  const { cell, columns, rows, luminance, solid } = grid;
  const { margin } = halftone;
  const width = grid.width + margin * 2;
  const height = grid.height + margin * 2;
  const dots = createLayer(width, height, scale, true);
  const debris = createLayer(width, height, scale);
  if (!dots.context || !debris.context) {
    return null;
  }
  dots.context.translate(margin, margin);
  debris.context.translate(margin, margin);

  const random = seeded(HOLOGRAM.seed);
  const tone = palette.dark ? halftone.dark : halftone.light;
  const ink = palette.css("foreground");
  const accent = palette.css("accent");

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
  const dotRows: DotRow[] = [];

  for (let row = 0; row < rows; row++) {
    const band = halftone.bands.find(({ at, rows: tall }) => {
      const first = Math.round(at * rows);
      return row >= first && row < first + tall;
    });
    const shift = band?.shift ?? 0;
    const y = (row + 0.5) * cell;
    const dissolving = clamp01((row / rows - feet.from) / (1 - feet.from)) * feet.share;
    const dotRow: DotRow = { y, x: [], r: [] };
    dots.context.fillStyle = ink;
    dots.context.globalAlpha = row % scanRow.every === scanRow.every - 1 ? scanRow.alpha : 1;

    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      if (!solid[index]) {
        continue;
      }
      const x = (column + 0.5) * cell + shift;

      if (random() < dissolving) {
        square(x, y - between(feet.rise, random()), cell + 1, random() < feet.accent, feet.alpha);
      } else {
        const radius = radiusOf(index);
        dotRow.x.push(x);
        dotRow.r.push(radius);
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
        const reach = between(fragments.reach, random());
        square(
          x + (outX / length) * reach,
          y + (outY / length) * reach,
          between(fragments.size, random()),
          random() < fragments.accent,
          between(fragments.alpha, random()),
        );
      }
    }

    dotRows.push(dotRow);
  }

  const hot = createLayer(width, height, scale);
  if (!hot.context) {
    return null;
  }
  hot.context.drawImage(dots.layer, 0, 0, dots.layer.width / scale, dots.layer.height / scale);
  hot.context.globalCompositeOperation = "source-in";
  hot.context.fillStyle = accent;
  hot.context.fillRect(0, 0, width, height);

  return {
    scale,
    dots: dots.layer,
    debris: debris.layer,
    hot: hot.layer,
    dotRows,
    left: easeEdge(dotRows, grid.feet, ({ x, r }, dot) => x[dot] - r[dot], Math.min),
    right: easeEdge(dotRows, grid.feet, ({ x, r }, dot) => x[dot] + r[dot], Math.max),
  };
}

// One edge of the dots on each row, averaged over the rows around it.
function easeEdge(
  dotRows: DotRow[],
  fallback: number,
  at: (row: DotRow, dot: number) => number,
  pick: (a: number, b: number) => number,
) {
  const { easeRows } = HOLOGRAM.scan;
  const edges = dotRows.map((row) =>
    row.x.length > 0 ? row.x.map((_, dot) => at(row, dot)).reduce((a, b) => pick(a, b)) : null,
  );
  return Float32Array.from(edges, (_, row) => {
    const near = edges
      .slice(Math.max(row - easeRows, 0), row + easeRows + 1)
      .filter((edge) => edge !== null);
    return near.length > 0 ? near.reduce((sum, edge) => sum + edge, 0) / near.length : fallback;
  });
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
  const image = new Image();

  let geometry: Geometry | null = null;
  let palette = readPalette();
  let grid: Grid | null = null;
  let layers: Layers | null = null;
  let pad: HTMLCanvasElement | null = null;
  // The glow and the beam, at their brightest. All three are layers rather than gradients
  // drawn live, whose shaders compile on first use: on the first hover, that was half a second
  // of dropped frames.
  let light: HTMLCanvasElement | null = null;
  let haze: HTMLCanvasElement | null = null;

  let onScreen = false;
  let loaded = false;
  let phase: HologramPhase = reduced ? "standing" : "waiting";
  let timeline: gsap.core.Timeline | null = null;
  // The timeline is paused for being out of sight, rather than by anything that drives it.
  let held = false;
  let destroyed = false;
  let frame = 0;
  let last = 0;
  let resizeTimer = 0;
  let patience = 0;
  let glitchCall: gsap.core.Tween | null = null;

  // What GSAP writes to. energy is how far into its hover state the hologram is, and the second
  // group is the reveal's: clock is the time on its timeline, and the rest are shares of each
  // part's normal self.
  const state = {
    float: 0,
    lift: 0,
    energy: 0,
    sweep: 0,

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
  let sparkDebt = 0;
  let glitch: { row: number; rows: number; shift: number } | null = null;
  let ringTravel = 0;

  let hovered = false;
  let scanning = false;
  let active = false;

  const trails: Trail[] = [];
  const particles: Particle[] = [];
  const sparks: Spark[] = [];

  let markReady: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  // --- Motion ------------------------------------------------------------

  // x and y are shares of the portal's radii, inside the pad.
  const padPoint = (reach: number) => {
    const angle = Math.random() * TAU;
    const radius = Math.sqrt(Math.random()) * reach;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  const spawnTrail = (trail: Partial<Trail>, index: number): Trail => {
    const { x, y } = padPoint(0.88);
    return Object.assign(trail, {
      x,
      depth: y,
      height: between(HOLOGRAM.trails.height),
      speed: between(HOLOGRAM.trails.speed),
      life: between(HOLOGRAM.trails.life),
      age: 0,
      accent: index % 2 === 0,
      seed: Math.random() * 1000,
    });
  };

  const spawnParticle = (particle: Partial<Particle>): Particle => {
    const { x, y } = padPoint(0.9);
    return Object.assign(particle, {
      x,
      y,
      size: between(HOLOGRAM.particles.size),
      speed: between(HOLOGRAM.particles.speed),
      phase: Math.random() * TAU,
      alpha: between(HOLOGRAM.particles.alpha),
      accent: Math.random() < HOLOGRAM.particles.accent,
      risen: 0,
      delay: 0,
    });
  };

  // Trails are already under way, and grow out of the pad with the rest of the reveal.
  for (let index = 0; index < HOLOGRAM.trails.count; index++) {
    const trail = spawnTrail({}, index);
    trail.age = reduced ? trail.life / 2 : Math.random() * trail.life;
    trails.push(trail);
  }
  for (let index = 0; index < HOLOGRAM.particles.active; index++) {
    const particle = spawnParticle({});
    particle.risen = -1;
    particles.push(particle);
  }

  const startParticles = () => {
    const { idle, stagger } = HOLOGRAM.particles;
    particles.forEach((particle, index) => {
      spawnParticle(particle);
      if (index < idle) {
        particle.delay = Math.random() * stagger;
      } else {
        particle.risen = -1;
      }
    });
  };

  let floating: gsap.core.Timeline | null = null;

  const startFloating = () => {
    const { distance, duration } = HOLOGRAM.float;
    floating = gsap
      .timeline({ paused: !running() })
      // From where he landed to the end of the swing, and then the swing itself.
      .to(state, { float: -distance, duration: duration / 2, ease: "sine.out" })
      .to(state, { float: distance, duration, ease: "sine.inOut", yoyo: true, repeat: -1 });
  };

  const glitchOnce = (then?: () => void) => {
    const { shift, rows, duration } = HOLOGRAM.glitch;
    const total = grid?.rows ?? 0;
    const tall = Math.round(between(rows));
    glitch = {
      row: Math.floor(Math.random() * Math.max(total - tall, 1)),
      rows: tall,
      shift: between(shift) * (Math.random() < 0.5 ? -1 : 1),
    };
    glitchCall = gsap.delayedCall(duration, () => {
      glitch = null;
      then?.();
    });
    glitchCall.paused(!running());
  };

  const scheduleGlitch = () => {
    glitchCall = gsap.delayedCall(between(HOLOGRAM.glitch.every), () => glitchOnce(scheduleGlitch));
    glitchCall.paused(!running());
  };

  // The one place that decides whether the hologram is in its hover state. A sweep that has
  // started keeps it there until it ends, whatever the pointer does in the meantime.
  const sync = () => {
    const next = hovered || scanning;
    if (next === active) {
      return;
    }
    active = next;
    if (!reduced) {
      gsap.to(state, {
        energy: active ? 1 : 0,
        lift: active ? HOLOGRAM.active.lift : 0,
        duration: active ? HOLOGRAM.active.enter : HOLOGRAM.active.leave,
        ease: "power2.out",
        overwrite: "auto",
      });
      if (active) {
        burst();
      }
    }
    onActiveChange(active);
  };

  const burst = () => {
    for (let index = HOLOGRAM.particles.idle; index < particles.length; index++) {
      const particle = particles[index];
      if (particle.risen < 0) {
        spawnParticle(particle);
        particle.delay = Math.random() * HOLOGRAM.particles.burst;
      }
    }
  };

  const startSweep = () => {
    if (reduced || scanning || destroyed || phase !== "standing") {
      return;
    }
    scanning = true;
    gsap.fromTo(
      state,
      { sweep: 0 },
      {
        sweep: 1,
        duration: HOLOGRAM.scan.duration,
        ease: "power2.inOut",
        overwrite: "auto",
        onComplete: () => {
          scanning = false;
          sync();
        },
      },
    );
  };

  const inBuild = () =>
    (phase === "building" || phase === "sinking") && state.build > 0 && state.build < 1;

  const advanceSparks = (dt: number) => {
    for (let index = sparks.length - 1; index >= 0; index--) {
      sparks[index].age += dt;
      if (sparks[index].age > sparks[index].life) {
        sparks.splice(index, 1);
      }
    }
    if (!inBuild() || !grid || !layers) {
      sparkDebt = 0;
      return;
    }
    const { rate, size, above, rise, life, accent } = REVEAL.sparks;
    for (sparkDebt += rate * dt; sparkDebt >= 1; sparkDebt--) {
      const y = buildLine(grid.height) - between(above);
      const [left, right] = edgesAt(y, grid.cell, layers);
      sparks.push({
        x: mix(left, right, Math.random()),
        y,
        size: between(size),
        rise: between(rise),
        life: between(life),
        age: 0,
        accent: Math.random() < accent,
      });
    }
  };

  const advance = (dt: number) => {
    const { energy } = state;
    advanceSparks(dt);
    ringTravel += dt * mix(1, HOLOGRAM.active.spin, energy);

    trails.forEach((trail, index) => {
      trail.age += dt;
      if (trail.age > trail.life) {
        spawnTrail(trail, index);
      }
    });

    particles.forEach((particle, index) => {
      const extra = index >= HOLOGRAM.particles.idle;
      if (particle.risen < 0) {
        return;
      }
      if (particle.delay > 0) {
        particle.delay -= dt;
        return;
      }
      particle.risen += particle.speed * dt * (extra ? 1.5 : 1);
      if (extra && energy < 0.01) {
        particle.risen = -1;
      } else if (particle.risen > HOLOGRAM.particles.rise) {
        spawnParticle(particle);
      }
    });
  };

  // --- Drawing -----------------------------------------------------------

  // From the far side, round by this share of a turn.
  const ellipse = (share: number, turn = 1) => {
    if (!geometry) {
      return;
    }
    const { cx, cy, rx, ry } = geometry.portal;
    context.beginPath();
    context.ellipse(cx, cy, rx * share, ry * share, 0, -TAU / 4, TAU * (turn - 1 / 4));
  };

  // Everything on the pad that holds still.
  const renderPad = () => {
    if (!geometry) {
      return;
    }
    const { portal, dpr } = geometry;
    const { rim, rimDashes, ticks } = HOLOGRAM.portal;
    const { layer, context: padContext } = createLayer(
      geometry.canvasWidth,
      geometry.canvasHeight,
      dpr,
    );
    if (!padContext) {
      return;
    }
    padContext.translate(-geometry.left, -geometry.top);
    const { cx, cy, rx, ry } = portal;

    padContext.fillStyle = palette.css(palette.dark ? "border" : "foreground");
    padContext.beginPath();
    padContext.ellipse(cx, cy + rim, rx, ry, 0, 0, Math.PI);
    padContext.lineTo(cx - rx, cy);
    padContext.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    padContext.closePath();
    padContext.fill();

    padContext.fillStyle = palette.css("accent", rimDashes.alpha);
    for (let index = 0; index < rimDashes.count; index++) {
      const turn = (index - (rimDashes.count - 1) / 2) * rimDashes.step;
      const angle = Math.PI / 2 + (turn * Math.PI) / 180;
      const [width, height] = rimDashes.size;
      padContext.fillRect(
        cx + rx * Math.cos(angle) - width / 2,
        cy + ry * Math.sin(angle) + rim / 2 - height / 2,
        width,
        height,
      );
    }

    padContext.fillStyle = palette.css("surface");
    padContext.strokeStyle = palette.css("border");
    padContext.lineWidth = 1;
    padContext.beginPath();
    padContext.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    padContext.fill();
    padContext.stroke();

    padContext.strokeStyle = palette.css("foreground", ticks.alpha);
    padContext.beginPath();
    for (let index = 0; index < ticks.count; index++) {
      const angle = (index / ticks.count) * TAU;
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      padContext.moveTo(cx + rx * ticks.from * cos, cy + ry * ticks.from * sin);
      padContext.lineTo(cx + rx * ticks.to * cos, cy + ry * ticks.to * sin);
    }
    padContext.stroke();

    pad = layer;

    renderLight();
  };

  const renderLight = () => {
    if (!geometry) {
      return;
    }
    const { cx, cy, rx } = geometry.portal;
    const { glow, beam } = HOLOGRAM.portal;
    const boost = HOLOGRAM.active.glow;
    const { layer, context: lightContext } = createLayer(
      geometry.canvasWidth,
      geometry.canvasHeight,
      geometry.dpr,
    );
    if (!lightContext) {
      return;
    }
    lightContext.translate(-geometry.left, -geometry.top);

    const reach = rx * glow.rx;
    const pool = lightContext.createRadialGradient(0, 0, 0, 0, 0, reach);
    pool.addColorStop(0, palette.css("accent", glow.alpha * boost));
    pool.addColorStop(0.5, palette.css("accent", glow.alpha * boost * 0.42));
    pool.addColorStop(1, palette.css("accent", 0));
    lightContext.save();
    lightContext.translate(cx, cy);
    lightContext.scale(1, glow.squash);
    lightContext.fillStyle = pool;
    lightContext.beginPath();
    lightContext.arc(0, 0, reach, 0, TAU);
    lightContext.fill();
    lightContext.restore();

    const rise = lightContext.createLinearGradient(0, cy, 0, cy - beam.height);
    rise.addColorStop(0, palette.css("accent", beam.alpha * boost));
    rise.addColorStop(1, palette.css("accent", 0));
    lightContext.fillStyle = rise;
    lightContext.beginPath();
    lightContext.moveTo(cx - rx * beam.foot, cy);
    lightContext.lineTo(cx - rx * beam.head, cy - beam.height);
    lightContext.lineTo(cx + rx * beam.head, cy - beam.height);
    lightContext.lineTo(cx + rx * beam.foot, cy);
    lightContext.closePath();
    lightContext.fill();
    light = layer;

    // Stretched across to whatever the scanline spans.
    const { haze: height, hazeAlpha } = HOLOGRAM.scan;
    const strip = createLayer(4, height, geometry.dpr);
    if (strip.context) {
      const fade = strip.context.createLinearGradient(0, height, 0, 0);
      fade.addColorStop(0, palette.css("accent", hazeAlpha));
      fade.addColorStop(1, palette.css("accent", 0));
      strip.context.fillStyle = fade;
      strip.context.fillRect(0, 0, 4, height);
      haze = strip.layer;
    }
  };

  const drawLayer = (layer: HTMLCanvasElement | null, alpha = 1) => {
    if (!geometry || !layer) {
      return;
    }
    const { left, top, dpr } = geometry;
    context.globalAlpha = alpha;
    context.drawImage(layer, left, top, layer.width / dpr, layer.height / dpr);
    context.globalAlpha = 1;
  };

  // Not on the pad's layer, since they flash.
  const drawCores = () => {
    context.lineWidth = 1;
    for (const { at, alpha, edge } of HOLOGRAM.portal.cores) {
      ellipse(at);
      context.globalAlpha = clamp01(state.pad * alpha * state.core);
      context.fillStyle = palette.css("accent");
      context.fill();
      if (edge > 0) {
        context.globalAlpha = clamp01(state.pad * edge * state.core);
        context.strokeStyle = palette.css("accent");
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  };

  // Dim until the reveal, which runs them round at full strength from the far side.
  const drawRings = () => {
    if (!geometry) {
      return;
    }
    const { rx, ry } = geometry.portal;
    const { dashed, segmented, lap } = HOLOGRAM.portal;
    const drawn = state.rings;
    for (const [ring, token, turn] of [
      [dashed, "foreground", -1],
      [segmented, "accent", 1],
    ] as const) {
      const { perimeter, dash } = fitDash(ring.dash, rx * ring.at, ry * ring.at);
      const travel = ringTravel / lap + (1 - drawn) / 2;
      context.setLineDash(dash);
      context.lineDashOffset = (turn * travel * perimeter) % perimeter;
      context.lineWidth = ring.width;
      context.strokeStyle = palette.css(token);
      if (drawn < 1) {
        context.globalAlpha = REVEAL.dim;
        ellipse(ring.at);
        context.stroke();
      }
      if (drawn > 0) {
        context.globalAlpha = 1;
        ellipse(ring.at, drawn);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    context.setLineDash([]);
  };

  const drawTrails = (front: boolean) => {
    if (!geometry || state.flow <= 0) {
      return;
    }
    const { cx, cy, rx, ry } = geometry.portal;
    const { block, gap, run, runGap, blockGap } = HOLOGRAM.trails;
    const alpha = HOLOGRAM.trails.alpha * state.flow;
    const period = block[1] + gap;
    const taller = mix(1, HOLOGRAM.active.trail, state.energy) * state.trail * state.flow;
    for (const trail of trails) {
      if (trail.depth > 0 !== front) {
        continue;
      }
      const through = trail.age / trail.life;
      const presence = clamp01(Math.min(through / 0.25, (1 - through) / 0.25));
      const height = trail.height * taller * mix(0.55, 1, presence);
      const x = Math.round(cx + trail.x * rx);
      const base = cy + trail.depth * ry;
      const travel = trail.age * trail.speed;
      const step = Math.floor(travel / period);
      context.fillStyle = palette.css(trail.accent ? "accent" : "foreground");
      for (let index = 0; index * period < height; index++) {
        // Follows its block up the trail, so the gaps rise with it.
        const id = index - step;
        if (
          hash(Math.floor(id / run), trail.seed) < runGap ||
          hash(id, trail.seed + 1) < blockGap
        ) {
          continue;
        }
        const rise = index * period + (travel % period);
        const fade = 1 - rise / height;
        if (fade > 0) {
          context.globalAlpha = alpha * presence * fade;
          context.fillRect(x, base - rise - block[1], block[0], block[1]);
        }
      }
    }
    context.globalAlpha = 1;
  };

  const drawParticles = () => {
    if (!geometry || reduced || state.flow <= 0) {
      return;
    }
    const { cx, cy, rx, ry } = geometry.portal;
    const { idle, rise, drift } = HOLOGRAM.particles;
    const ink = palette.css("foreground");
    const accent = palette.css("accent");
    particles.forEach((particle, index) => {
      if (particle.risen < 0 || particle.delay > 0) {
        return;
      }
      const through = particle.risen / rise;
      const presence = Math.min(particle.risen / 14, 1) * (1 - through);
      context.globalAlpha = clamp01(
        particle.alpha * presence * state.flow * (index < idle ? 1 : state.energy),
      );
      context.fillStyle = particle.accent ? accent : ink;
      context.fillRect(
        cx + particle.x * rx + Math.sin(particle.phase + particle.risen / 38) * drift,
        cy + particle.y * ry - particle.risen,
        particle.size,
        particle.size,
      );
    });
    context.globalAlpha = 1;
  };

  // Limits drawing to the rows between these, or to the rest of the figure.
  const clipRows = (
    top: number,
    bottom: number,
    inside: boolean,
    width: number,
    height: number,
  ) => {
    const margin = HOLOGRAM.halftone.margin;
    context.beginPath();
    if (inside) {
      context.rect(-margin, top, width + margin * 2, bottom - top);
    } else {
      context.rect(-margin, -margin, width + margin * 2, top + margin);
      context.rect(-margin, bottom, width + margin * 2, height + margin - bottom);
    }
    context.clip();
  };

  const drawFigure = (now: number) => {
    if (!geometry || !grid || !layers) {
      return;
    }
    const { portal, dpr } = geometry;
    const { margin } = HOLOGRAM.halftone;
    const { width, height, cell } = grid;
    const x = Math.round((portal.cx - grid.feet) * dpr) / dpr;
    const y = portal.cy + portal.ry * HOLOGRAM.portal.stand - height + state.float + state.lift;
    const { scale, dots, debris, hot, dotRows } = layers;
    const layerWidth = dots.width / scale;
    const layerHeight = dots.height / scale;
    const drawDots = (shift = 0) =>
      context.drawImage(dots, shift - margin, -margin, layerWidth, layerHeight);

    if (phase !== "standing") {
      context.save();
      context.translate(x, y);
      drawForming(now, grid, layers);
      context.restore();
      return;
    }

    context.save();
    context.globalAlpha = state.figure;

    const sweeping = scanning && state.sweep > 0 && state.sweep < 1;
    if (sweeping) {
      const { band, jitter, jitterMs } = HOLOGRAM.scan;
      context.translate(x, y);
      const line = state.sweep * height;
      const firstRow = Math.max(Math.floor((line - band) / cell), 0);
      const lastRow = Math.min(Math.floor(line / cell), grid.rows);

      context.save();
      clipRows(firstRow * cell, lastRow * cell, false, width, height);
      drawDots();
      context.restore();

      const tick = Math.floor(now / jitterMs);
      const size = cell * scale;
      for (let row = firstRow; row < lastRow; row++) {
        const { x: middles, y: middle } = dotRows[row];
        // 1 at the line, easing to 0 where the dots have settled back.
        const heat = clamp01(1 - (line - middle) / band);
        const hotness = clamp01(heat * 1.8);
        const sourceY = (middle - cell / 2 + margin) * scale;
        for (const [layer, alpha] of [
          [dots, 1 - hotness],
          [hot, hotness],
        ] as const) {
          if (alpha <= 0) {
            continue;
          }
          context.globalAlpha = alpha;
          for (let index = 0; index < middles.length; index++) {
            const from = middles[index] - cell / 2;
            const nudge = (hash(index + row * 131, tick) * 2 - 1) * jitter * heat;
            context.drawImage(
              layer,
              (from + margin) * scale,
              sourceY,
              size,
              size,
              from + nudge,
              middle - cell / 2,
              cell,
              cell,
            );
          }
        }
      }
    } else if (glitch) {
      // Snapped, so the slice lines up with the rows on either side of it.
      context.translate(x, Math.round(y * dpr) / dpr);
      const top = glitch.row * cell;
      const bottom = top + glitch.rows * cell;
      context.save();
      clipRows(top, bottom, false, width, height);
      drawDots();
      context.restore();
      context.save();
      clipRows(top, bottom, true, width, height);
      drawDots(glitch.shift);
      context.restore();
    } else {
      context.translate(x, y);
      drawDots();
    }

    context.globalAlpha = state.figure;
    context.drawImage(debris, -margin, -margin, layerWidth, layerHeight);

    if (sweeping) {
      const { overhang, haze: tall, hazeAlpha } = HOLOGRAM.scan;
      drawScanline(state.sweep * height, {
        overhang,
        tall,
        hazeAlpha,
        alpha: clamp01(Math.min(state.sweep, 1 - state.sweep) / 0.04),
      });
    }
    context.restore();
  };

  // The rest of the figure's drawing is in its own coordinates, with the soles at the bottom.

  const buildLine = (height: number) => height - state.build * (height + REVEAL.overshoot);

  // When the line got to y. Its ease undone rather than remembered, so any point on the timeline
  // draws the same whichever way it is running.
  const passedAt = (y: number, height: number) => {
    const { from, to } = REVEAL.build;
    const share = clamp01((height - y) / (height + REVEAL.overshoot));
    const through = share < 0.5 ? Math.cbrt(share / 4) : 1 - Math.cbrt((1 - share) / 4);
    return mix(from, to, through);
  };

  const edgesAt = (y: number, cell: number, { left, right }: Layers) => {
    const row = Math.min(Math.max(y / cell, 0), left.length - 1);
    const above = Math.floor(row);
    const below = Math.min(above + 1, left.length - 1);
    return [
      mix(left[above], left[below], row - above),
      mix(right[above], right[below], row - above),
    ] as const;
  };

  // The part of one of the figure's layers between two heights.
  const drawSlice = (
    layer: HTMLCanvasElement,
    scale: number,
    top: number,
    bottom: number,
    shift = 0,
  ) => {
    const { margin } = HOLOGRAM.halftone;
    const from = Math.max((top + margin) * scale, 0);
    const tall = Math.min((bottom + margin) * scale, layer.height) - from;
    if (tall > 0) {
      context.drawImage(
        layer,
        0,
        from,
        layer.width,
        tall,
        shift - margin,
        from / scale - margin,
        layer.width / scale,
        tall / scale,
      );
    }
  };

  // He is cut off at the line. Below the band it is the cached figure, and in the band each dot
  // is cut out of it alone, so that they can come up one by one.
  const drawForming = (now: number, { cell, rows, height }: Grid, formed: Layers) => {
    const { halftone, scan } = HOLOGRAM;
    const { margin, feet } = halftone;
    const { scale, dots, hot, debris, dotRows } = formed;
    const { band, dot, jitter } = REVEAL;
    if (state.build <= 0 && state.debris <= 0) {
      return;
    }
    const line = buildLine(height);
    const bottom = height + margin;

    // Whole rows, by where their dots' middles are.
    const firstRow = Math.max(Math.ceil(line / cell - 0.5), 0);
    const settledRow = Math.max(Math.ceil((line + band) / cell - 0.5), 0);
    const settled = settledRow * cell;

    context.globalAlpha = 1;
    if (glitch) {
      const from = Math.max(glitch.row * cell, settled);
      const to = Math.max((glitch.row + glitch.rows) * cell, settled);
      drawSlice(dots, scale, settled, from);
      drawSlice(dots, scale, from, to, glitch.shift);
      drawSlice(dots, scale, to, bottom);
    } else {
      drawSlice(dots, scale, settled, bottom);
    }

    // What has come off the feet is there before they are.
    context.globalAlpha = state.debris;
    const feetTop = rows * feet.from * cell - feet.rise[1] - cell;
    drawSlice(debris, scale, Math.min(line, feetTop), bottom);

    const tick = Math.floor(now / scan.jitterMs);
    const size = cell * scale;
    for (let row = firstRow; row < Math.min(settledRow, rows); row++) {
      const { x: middles, y: middle } = dotRows[row];
      const below = (middle - line) / band;
      const age = state.clock - passedAt(middle, height);
      // 1 in the accent, and 0 once it is the figure's own. By the band while the line is
      // quick, and by time once it has stopped.
      const heat = clamp01(Math.min((1 - below) / 0.6, 1 - (age - 0.2) / 0.2));
      for (const [layer, alpha] of [
        [dots, 1 - heat],
        [hot, heat],
      ] as const) {
        if (alpha <= 0) {
          continue;
        }
        context.globalAlpha = alpha;
        for (let index = 0; index < middles.length; index++) {
          const turn = hash(index + row * 131, 17);
          const grown = clamp01(
            Math.max((age - turn * dot.delay) / dot.grow, (below - turn * 0.4) / 0.5),
          );
          if (grown <= 0) {
            continue;
          }
          const across = cell * (1 - (1 - grown) ** 2);
          const nudge = (hash(index + row * 131, tick) * 2 - 1) * jitter * heat;
          context.drawImage(
            layer,
            (middles[index] - cell / 2 + margin) * scale,
            (middle - cell / 2 + margin) * scale,
            size,
            size,
            middles[index] + nudge - across / 2,
            middle - across / 2,
            across,
            across,
          );
        }
      }
    }

    if (flash > 0) {
      flash -= 1;
      context.globalAlpha = 1;
      drawSlice(hot, scale, firstRow * cell, settled);
    }
    drawSparks();
    if (state.line > 0 && state.build > 0) {
      const { overhang, haze: tall, hazeAlpha } = REVEAL;
      drawScanline(line, { overhang, tall, hazeAlpha, alpha: state.line });
    }
  };

  const drawSparks = () => {
    const ink = palette.css("foreground");
    const accent = palette.css("accent");
    for (const spark of sparks) {
      const through = spark.age / spark.life;
      context.globalAlpha = 1 - through;
      context.fillStyle = spark.accent ? accent : ink;
      context.fillRect(
        spark.x - spark.size / 2,
        spark.y - spark.rise * through,
        spark.size,
        spark.size,
      );
    }
    context.globalAlpha = 1;
  };

  // Across the silhouette at that height, with a haze above it. The haze's layer is the scan's,
  // scaled down to whatever this one is.
  const drawScanline = (
    y: number,
    look: { overhang: number; tall: number; hazeAlpha: number; alpha: number },
  ) => {
    if (!grid || !layers || !haze) {
      return;
    }
    const { line, cap, hazeAlpha } = HOLOGRAM.scan;
    const [from, to] = edgesAt(y, grid.cell, layers);
    const left = from - look.overhang;
    const right = to + look.overhang;

    context.save();
    context.translate(0, y);
    context.globalAlpha = look.alpha * (look.hazeAlpha / hazeAlpha);
    context.drawImage(haze, left, -look.tall, right - left, look.tall);
    context.globalAlpha = look.alpha;
    context.fillStyle = palette.css("accent");
    context.fillRect(left, -line / 2, right - left, line);
    context.fillRect(left - cap / 2, -cap / 2, cap, cap);
    context.fillRect(right - cap / 2, -cap / 2, cap, cap);
    context.restore();
  };

  const draw = (now: number) => {
    if (!geometry) {
      return;
    }
    const { dpr, left, top, canvasWidth, canvasHeight, portal } = geometry;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);

    const { glow } = HOLOGRAM.active;
    if (state.glow > 0) {
      drawLayer(light, clamp01((state.glow * mix(1, glow, state.energy)) / glow));
    }
    drawLayer(pad, state.pad);
    drawCores();
    drawRings();
    drawTrails(false);
    drawFigure(now);

    // The near half of both rings again, over the feet, so he stands in the portal. There is
    // nothing to stand in it until they are drawn.
    if (state.rings >= 1) {
      context.save();
      context.beginPath();
      context.rect(left, portal.cy, canvasWidth, canvasHeight);
      context.clip();
      drawRings();
      context.restore();
    }

    drawTrails(true);
    drawParticles();
  };

  // --- Lifecycle ---------------------------------------------------------

  const visible = () => onScreen && !document.hidden;
  const running = () => !reduced && !destroyed && phase !== "waiting" && visible();

  const tick = (now: number) => {
    // After a pause the gap can be minutes, and nothing should jump by that much.
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    advance(dt);
    draw(now);
    frame = window.requestAnimationFrame(tick);
  };

  // Out of sight, a build stops where it is and waits to be seen. A sinking one has nobody left
  // to see it, and has to be back at the start before the section comes round again.
  const holdReveal = () => {
    if (!timeline) {
      return;
    }
    if (phase === "sinking" && !visible()) {
      timeline.progress(0).pause();
      setPhase("waiting");
    } else if (phase === "building" && !visible() && !timeline.paused()) {
      held = true;
      timeline.pause();
    } else if (phase === "building" && visible() && held) {
      held = false;
      timeline.resume();
    }
  };

  const startIdle = () => {
    if (!reduced) {
      startFloating();
      scheduleGlitch();
    }
  };

  // The hover too, which has no business with a figure that isn't all there.
  const stopIdle = () => {
    floating?.kill();
    floating = null;
    glitchCall?.kill();
    glitch = null;
    hovered = false;
    scanning = false;
    gsap.killTweensOf(state, "sweep,energy,lift,float");
    gsap.to(state, { float: 0, lift: 0, energy: 0, duration: 0.2, ease: "power1.out" });
    if (active) {
      active = false;
      onActiveChange(false);
    }
  };

  const setPhase = (next: HologramPhase) => {
    if (next === phase || reduced || destroyed) {
      return;
    }
    const previous = phase;
    phase = next;
    held = false;
    if (previous === "standing") {
      stopIdle();
    }
    if (previous === "waiting") {
      startParticles();
    }
    if (next === "standing") {
      sparks.length = 0;
      startIdle();
    }
    if (next === "waiting") {
      sparks.length = 0;
      glitch = null;
    }
    syncLoop();
    refresh();
  };

  const syncLoop = () => {
    holdReveal();
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
    }
    floating?.paused(!run);
    glitchCall?.paused(!run);
  };

  // Repaints now when no loop is going to.
  const refresh = () => {
    if (frame === 0) {
      draw(performance.now());
    }
  };

  const measure = (): Geometry => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const { figureHeight, portal } = hologramLayout(width, height);
    const { bleed } = HOLOGRAM.stage;
    const reach = Math.ceil(portal.rx * bleed.side);
    return {
      width,
      height,
      dpr: Math.min(window.devicePixelRatio || 1, HOLOGRAM.maxDpr),
      left: Math.floor(portal.cx - reach),
      top: -bleed.top,
      canvasWidth: reach * 2,
      canvasHeight: height + bleed.top + bleed.bottom,
      figureHeight,
      portal,
    };
  };

  const renderLayers = () => {
    renderPad();
    layers = grid && geometry ? renderFigure(grid, palette, geometry.dpr) : null;
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
      geometry.dpr === next.dpr
    ) {
      return;
    }
    geometry = next;
    canvas.width = Math.round(next.canvasWidth * next.dpr);
    canvas.height = Math.round(next.canvasHeight * next.dpr);
    canvas.style.left = `${next.left}px`;
    canvas.style.top = `${next.top}px`;
    canvas.style.width = `${next.canvasWidth}px`;
    canvas.style.height = `${next.canvasHeight}px`;
    grid = loaded ? sampleGrid(image, next) : null;
    renderLayers();
    refresh();
  };

  const load = () => {
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
        proximity.disconnect();
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
  document.addEventListener("visibilitychange", syncLoop);

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
    enter() {
      if (phase !== "standing") {
        return;
      }
      hovered = true;
      startSweep();
      sync();
    },

    leave() {
      hovered = false;
      sync();
    },

    scan() {
      startSweep();
      sync();
    },

    ready: () => ready,

    reveal(target) {
      const { duration, boot, build, lockAt, flickerAt, coreFlash, glowPeak } = REVEAL;
      timeline = target;
      target
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
            flash = target.reversed() ? 0 : REVEAL.flashFrames;
          },
          undefined,
          lockAt,
        )
        .call(
          () => {
            if (!target.reversed()) {
              glitchOnce();
            }
          },
          undefined,
          flickerAt,
        );
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
      document.removeEventListener("visibilitychange", syncLoop);
      resize.disconnect();
      proximity.disconnect();
      visibility.disconnect();
      themeChange.disconnect();
      floating?.kill();
      glitchCall?.kill();
      gsap.killTweensOf(state);
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
