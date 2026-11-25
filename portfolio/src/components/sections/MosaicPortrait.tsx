"use client";

import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

// Every number behind the mosaic. Lengths are CSS pixels and times are seconds.
const MOSAIC = {
  // Converted to whole device pixels when the grid is built, so a tile is the same
  // size everywhere on the portrait at any display scale.
  tileSize: 3,
  gap: 1,
  // Across the portrait's box. The figure's widest part fills about 84% of it.
  minColumns: 110,
  // How far the tile may shrink for minColumns before the gap gives way too.
  minTileSize: 2,
  maxTiles: 25_000,
  maxDpr: 2,
  minAlpha: 0.35,
  // From the photo's luminance to each tile's tone, in the order toneMap runs them. Tone runs from
  // shadow (0) to highlight (1) and nothing here knows the theme, so neither can come out as a
  // negative. "Copy config" on the ?mosaicTune=1 panel gives this and accent to paste over them.
  tone: {
    // Cells of reach for the median that goes first, so nothing after it amplifies noise, and
    // the step in luminance from it past which a cell is detail and stays as it is.
    denoise: 1,
    denoiseLimit: 0.04,
    // Percentiles of the figure's luminance.
    blackPoint: 1,
    whitePoint: 99,
    // The most any band of tone is stretched, as a multiple of its share of the figure, where 1
    // leaves the levels as they are. The navy shirt is most of the figure in about 8 levels out of
    // 255, and without this it lands on two levels of the ramp and its folds are gone.
    balance: 6,
    // How much steeper the S-curve is at its middle, where 1 leaves the tone alone.
    contrast: 1.3,
    clarity: 0.35,
    clarityRadius: 8,
    claheBlend: 0.15,
    claheRegions: [3, 4],
    claheClipLimit: 1.5,
    keyLight: { falloff: 0.18 },
    // How much further the face's shadows go from its highlights, and how far the hair is
    // burnt down, darker than the shirt it is lighter than in the photo, to frame the face.
    faceDepth: 0.9,
    hairBurn: 0.7,
    edgeBurn: 0.08,
    edgeBurnCells: 4,
    sharpen: 0.8,
    edgeThreshold: 0.06,
    jitter: 0.02,
    levels: 32,
    bottomFade: { minScale: 0.4 },
    // The light theme is a print: one ink, --foreground, on the page. A tile's dot grows with its
    // darkness instead of the tile changing colour, and the highlights print nothing. These stand
    // in for the settings above in that theme alone, so the dark theme never sees them.
    light: {
      clarity: 0.9,
      sharpen: 1.4,
      faceDepth: 0.2,
      // An S-curve of its own on the finished tone, where 1 leaves it alone.
      printContrast: 1.2,
      // Dots print from this tone, and nothing at all from the second, so highlights stay open.
      openFrom: 0.92,
      openTo: 0.985,
      // The least a face's dot covers of its cell while it is a midtone, as a share.
      midtoneDot: 0.18,
      // The least a T-shirt dot covers. It is a dark feature, so its folds lighten its dots rather
      // than open them to the page.
      shirtDot: 0.72,
      // The least a dot covers on the outermost cells of the figure, fading over contourCells, so
      // the jaw and neck keep an edge where the skin itself is a highlight.
      contour: 0.35,
      contourCells: 3,
      // The biggest dot, as a share of its cell. Under 1 keeps the grid visible in the shadows.
      maxDot: 0.97,
      // Solid down to this share of the box, as in the dark theme, but for longer.
      fadeFrom: 0.95,
    },
  },
  // Which part of the figure a cell is, from its colour in the photo.
  masks: {
    // Luminance, 0-1. Warm cells darker than this aren't skin, unless the face encloses them.
    skinFrom: 0.2,
    hairBelow: 0.4,
    outlineCells: 2,
    // The first warm patch from the top this big, as a share of the figure, is the face.
    faceShare: 0.01,
  },
  // Light on the T-shirt's raised folds, and nowhere else. Percentages of its cells, leaving out
  // the hemBand cells next to the skin, so the collar and sleeves don't get a pink ring.
  accent: {
    shirtHighlightPercent: 10,
    fullPercent: 2,
    maxMix: 0.55,
    hemBand: 3,
    // Cells. A fold ridge is measured against the shirt this far around it.
    foldRadius: 3,
  },
  color: {
    // "at" is the tone of a tile, from shadow (0) to highlight (1), and the ramp between stops
    // runs through OKLab, where the mid-tones don't go grey. A stop's alpha lays it over the page.
    // Dark theme only: the light one is ink alone, see tone.light.
    dark: {
      ramp: [
        { at: 0, token: "--border", alpha: 0.3 },
        { at: 0.15, token: "--border", alpha: 1 },
        { at: 0.55, token: "--muted", alpha: 1 },
        { at: 0.92, token: "--foreground", alpha: 1 },
      ],
    },
  },
  // The name sits behind the canvas, and hovering it parts the tiles over its letters: they
  // rest at this opacity and scale. Each takes duration to get there, the last starting
  // stagger after the first, left to right, and they all close over outDuration.
  textReveal: {
    opacity: 0.15,
    scale: 0.5,
    duration: 0.25,
    stagger: 0.15,
    outDuration: 0.4,
    // Coverage of a grid cell by the dilated letters that counts as being under them.
    coverage: 0.35,
  },
  // The smallest dot worth printing, as a share of its cell, in the light theme.
  minDot: 0.12,
  rebuild: { debounceMs: 150, minChange: 1 },
  // Solid down to this share of the box, then gone at its bottom edge, the hero's. The light
  // theme's is tone.light.fadeFrom.
  fadeFrom: 0.86,
  // Relative to the portrait box: the face, which the figure gathers outward from.
  focus: { x: 0.5, y: 0.28 },
  assemble: {
    // Degrees. The ease is expo.out, written out in the flight's vertex shader.
    rotation: 45,
    // Each run lasts flight + stagger + scatter: stagger follows the distance from
    // the focus and scatter is random. The intro starts this at 2.3s on its master
    // timeline, once its word has become the real name, so the last tile lands at 3.3s.
    intro: { flight: 0.7, stagger: 0.24, scatter: 0.06 },
    touch: { flight: 0.56, stagger: 0.19, scatter: 0.05 },
    quick: { flight: 0.42, stagger: 0.14, scatter: 0.04 },
  },
  dust: {
    count: 150,
    // The full count down to this hero area in CSS pixels, then fewer in proportion, so
    // a phone is not four times as dense as a laptop.
    fullFrom: 1_000_000,
    minShare: 0.35,
    // --dust is the foreground in the dark theme, and a pale blue in the light one, which is
    // why it is nearly opaque there.
    token: "--dust",
    opacity: { dark: { min: 0.1, max: 0.3 }, light: { min: 0.6, max: 1 } },
    // Pixels and radians per second.
    drift: 5,
    twinkle: { min: 0.5, max: 1.5 },
  },
  idle: {
    fps: 20,
    // A few accent tiles at a time, breathing by this share of their brightness.
    twinkle: { count: 24, duration: { min: 1.6, max: 3.2 }, strength: 0.15 },
  },
  hover: {
    radius: 110,
    // Near the pointer a tile now and then steps this far off its cell and back, each in its own
    // direction and time. How often falls with distance, so nothing marks out a shape.
    maxMove: 1.5,
    // Roughly the share of the time a tile is off its cell, right at the pointer.
    busy: 0.2,
    // Radians per second, so a tile gets a turn about every 2.6s.
    rate: 2.4,
    spring: 0.05,
    friction: 0.86,
    settledBelow: 0.05,
  },
} as const;

const HISTOGRAM_BINS = 256;
// Between a plain tile and the accent. Each is a whole set of colours for the flight's shader,
// which has room for about 250.
const ACCENT_STEPS = 4;
const ACCENT_FULL = ACCENT_STEPS + 1;
const IDLE_FRAME_MS = 1000 / MOSAIC.idle.fps - 2;
// The sticky header without its hairline, in rem terms the h-16 it is.
const HEADER_PX = 64;
const PHYSICS_STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 4;

const SKIN = 1;
const SHIRT = 2;
const HAIR = 3;
const OUTLINE = 4;

type Rgb = readonly [number, number, number];
type RampStop = { at: number; rgb: Rgb };
type RampStopConfig = { readonly at: number; readonly token: string; readonly alpha: number };
type Widened<T> = T extends number
  ? number
  : T extends boolean
    ? boolean
    : { readonly [K in keyof T]: Widened<T[K]> };
// The part of the config the tuning panel can change with the page open.
export type MosaicTuning = Widened<Pick<typeof MOSAIC, "tone" | "accent">>;
type Timing = { readonly flight: number; readonly stagger: number; readonly scatter: number };
type Source = ReturnType<typeof readPortrait> & object;
type Cells = ReturnType<typeof sampleCells>;
type Regions = ReturnType<typeof classifyRegions>;
type Tiles = ReturnType<typeof createTiles>;

export type MosaicPortraitHandle = {
  // For the intro to place on its timeline. Null when the image has not loaded yet,
  // in which case the intro's finish falls back on enter().
  assemble: () => gsap.core.Tween | null;
  // The short assembly, for a load without the intro. A no-op once one has started.
  enter: () => void;
};

type Mosaic = MosaicPortraitHandle & {
  destroy: () => void;
  // Development only: rebuilds the grid with a changed config.
  retune: (tuning: MosaicTuning) => void;
};

type MosaicPortraitProps = {
  ref: Ref<MosaicPortraitHandle>;
  imageRef: RefObject<HTMLImageElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
  nameRef: RefObject<HTMLHeadingElement | null>;
};

function createTiles(count: number) {
  const floats = () => new Float32Array(count);
  const flags = () => new Uint8Array(count);
  return {
    count,
    x: floats(),
    y: floats(),
    vx: floats(),
    vy: floats(),
    targetX: floats(),
    targetY: floats(),
    startX: floats(),
    startY: floats(),
    startRotation: floats(),
    delay: floats(),
    tone: floats(),
    jitter: floats(),
    fade: floats(),
    // The cell it is on, for what it needs to know of its theme's tone.
    cell: new Uint32Array(count),
    // Its size, as a share of a full tile: shrunk by the bottom fade in the dark theme, and in
    // the light one a dot's, from nothing up to the whole cell.
    shrink: floats(),
    reach: floats(),
    // Fixed for each tile, 0-1: when and which way it moves under the pointer.
    seed: floats(),
    // How far it has parted for the name, 0-1.
    reveal: floats(),
    // 0 = none, then each step of its mix towards the accent, up to ACCENT_FULL.
    accent: flags(),
    underName: flags(),
    // Its cell on the cache is a hole, so the name can show through once it has parted.
    parted: flags(),
    // Off its cached image: displaced, parted or both, and drawn every frame.
    active: flags(),
    colorIndex: flags(),
    // Tile indexes grouped by colour, the order they are drawn in.
    order: new Uint16Array(count),
    activeList: new Uint16Array(count),
  };
}

// The decoded image at its natural size, down to where the box's crop ends, and where that
// crop sits on it: the same sums as the image's object-cover + object-top.
function readPortrait(image: HTMLImageElement, boxWidth: number, boxHeight: number) {
  const { naturalWidth: width, naturalHeight } = image;
  const scale = Math.max(boxWidth / width, boxHeight / naturalHeight);
  const height = Math.min(Math.ceil(boxHeight / scale), naturalHeight);
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const context = offscreen.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0);
  return {
    data: context.getImageData(0, 0, width, height).data,
    width,
    height,
    scale,
    cropX: (width - boxWidth / scale) / 2,
  };
}

function luminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// Area-averages the image into the grid, in whole device pixels (pitch and gap). Each
// image pixel counts for the share of it inside the cell, so nothing is nearest-neighbour
// however the cell's edges fall.
function sampleCells(
  { data, width, height, scale, cropX }: Source,
  boxWidth: number,
  boxHeight: number,
  dpr: number,
  pitch: number,
  gap: number,
) {
  const columns = Math.floor((boxWidth * dpr + gap) / pitch);
  const rows = Math.floor((boxHeight * dpr + gap) / pitch);
  // Anchored to the bottom centre, so a small change in the box's height can't move the
  // whole grid, and in whole device pixels, so tiles fly to the cells they stay on.
  const marginX = Math.round((boxWidth * dpr - (columns * pitch - gap)) / 2);
  const marginY = Math.round(boxHeight * dpr - (rows * pitch - gap));
  const size = columns * rows;
  const figure = new Uint8Array(size);
  const red = new Float32Array(size);
  const green = new Float32Array(size);
  const blue = new Float32Array(size);
  const brightness = new Float32Array(size);
  const toImage = 1 / (dpr * scale);
  const span = pitch * toImage;
  let count = 0;

  for (let row = 0; row < rows; row++) {
    const top = (marginY - gap / 2 + row * pitch) * toImage;
    const bottom = top + span;
    const fromY = Math.max(Math.floor(top), 0);
    const toY = Math.min(Math.ceil(bottom), height);

    for (let column = 0; column < columns; column++) {
      const left = cropX + (marginX - gap / 2 + column * pitch) * toImage;
      const right = left + span;
      const fromX = Math.max(Math.floor(left), 0);
      const toX = Math.min(Math.ceil(right), width);

      // Weighted by alpha: the cutout's transparent pixels have a colour too, and it
      // would otherwise bleed into the silhouette's edge.
      let sumRed = 0;
      let sumGreen = 0;
      let sumBlue = 0;
      let sumAlpha = 0;
      let area = 0;
      for (let y = fromY; y < toY; y++) {
        const overlapY = Math.min(y + 1, bottom) - Math.max(y, top);
        for (let x = fromX; x < toX; x++) {
          const overlap = overlapY * (Math.min(x + 1, right) - Math.max(x, left));
          const index = (y * width + x) * 4;
          const weight = data[index + 3] * overlap;
          sumRed += data[index] * weight;
          sumGreen += data[index + 1] * weight;
          sumBlue += data[index + 2] * weight;
          sumAlpha += weight;
          area += overlap;
        }
      }

      if (area > 0 && sumAlpha / (area * 255) >= MOSAIC.minAlpha) {
        const cell = row * columns + column;
        figure[cell] = 1;
        red[cell] = sumRed / sumAlpha;
        green[cell] = sumGreen / sumAlpha;
        blue[cell] = sumBlue / sumAlpha;
        brightness[cell] = luminance(red[cell], green[cell], blue[cell]) / 255;
        count++;
      }
    }
  }

  return { columns, rows, marginX, marginY, figure, red, green, blue, brightness, count };
}

// The configured size, then finer for the column minimum, then coarser for the tile
// budget. Whole device pixels throughout, which is what keeps every gap the same width.
function fitGrid(source: Source, boxWidth: number, boxHeight: number, dpr: number) {
  const { tileSize, gap, minColumns, minTileSize, maxTiles } = MOSAIC;
  const width = boxWidth * dpr;
  const tileFloor = Math.max(2, Math.round(minTileSize * dpr));
  let tile = Math.max(2, Math.round(tileSize * dpr));
  let space = Math.max(1, Math.round(gap * dpr));

  while (Math.floor((width + space) / (tile + space)) < minColumns) {
    if (tile > tileFloor) {
      tile--;
    } else if (space > 1) {
      space--;
    } else if (tile > 2) {
      // Only a high-density screen gets here, where this is still a sharp tile.
      tile--;
    } else {
      break;
    }
  }

  let cells = sampleCells(source, boxWidth, boxHeight, dpr, tile + space, space);
  while (cells.count > maxTiles) {
    const over = Math.sqrt(cells.count / maxTiles) - 1;
    tile += Math.max(1, Math.floor((tile + space) * over));
    cells = sampleCells(source, boxWidth, boxHeight, dpr, tile + space, space);
  }

  return { ...cells, pitch: tile + space, tileSize: tile };
}

// The values over a mask and the mask itself, blurred alike and divided at the end.
type Blurring = [values: Float32Array, weights: Float32Array];

// A kernel's weighted sums along every row.
function kernelRows([values, weights]: Blurring, columns: number, rows: number, kernel: number[]) {
  const reach = (kernel.length - 1) / 2;
  const next: Blurring = [new Float32Array(values.length), new Float32Array(values.length)];
  for (let row = 0; row < rows; row++) {
    const start = row * columns;
    for (let column = 0; column < columns; column++) {
      let value = 0;
      let weight = 0;
      const to = Math.min(reach, columns - 1 - column);
      for (let step = Math.max(-reach, -column); step <= to; step++) {
        value += values[start + column + step] * kernel[step + reach];
        weight += weights[start + column + step] * kernel[step + reach];
      }
      next[0][start + column] = value;
      next[1][start + column] = weight;
    }
  }
  return next;
}

// The same down every column, a whole row at a time, which keeps to memory in order.
function kernelColumns(
  [values, weights]: Blurring,
  columns: number,
  rows: number,
  kernel: number[],
) {
  const reach = (kernel.length - 1) / 2;
  const next: Blurring = [new Float32Array(values.length), new Float32Array(values.length)];
  for (let row = 0; row < rows; row++) {
    const to = Math.min(reach, rows - 1 - row);
    for (let step = Math.max(-reach, -row); step <= to; step++) {
      const share = kernel[step + reach];
      const from = (row + step) * columns;
      for (let column = 0; column < columns; column++) {
        next[0][row * columns + column] += values[from + column] * share;
        next[1][row * columns + column] += weights[from + column] * share;
      }
    }
  }
  return next;
}

// Plain sums over a window reaching the same way each side, along every row and then down every
// column, as running totals, so it costs the same however far it reaches.
function boxBoth([values, weights]: Blurring, columns: number, rows: number, reach: number) {
  const across: Blurring = [new Float32Array(values.length), new Float32Array(values.length)];
  for (let row = 0; row < rows; row++) {
    const start = row * columns;
    let value = 0;
    let weight = 0;
    for (let column = 0; column < Math.min(reach, columns); column++) {
      value += values[start + column];
      weight += weights[start + column];
    }
    for (let column = 0; column < columns; column++) {
      if (column + reach < columns) {
        value += values[start + column + reach];
        weight += weights[start + column + reach];
      }
      if (column - reach - 1 >= 0) {
        value -= values[start + column - reach - 1];
        weight -= weights[start + column - reach - 1];
      }
      across[0][start + column] = value;
      across[1][start + column] = weight;
    }
  }

  const next: Blurring = [new Float32Array(values.length), new Float32Array(values.length)];
  const value = new Float64Array(columns);
  const weight = new Float64Array(columns);
  const add = (row: number, sign: number) => {
    for (let column = 0; column < columns; column++) {
      value[column] += across[0][row * columns + column] * sign;
      weight[column] += across[1][row * columns + column] * sign;
    }
  };
  for (let row = 0; row < Math.min(reach, rows); row++) {
    add(row, 1);
  }
  for (let row = 0; row < rows; row++) {
    if (row + reach < rows) {
      add(row + reach, 1);
    }
    if (row - reach - 1 >= 0) {
      add(row - reach - 1, -1);
    }
    next[0].set(value, row * columns);
    next[1].set(weight, row * columns);
  }
  return next;
}

// A gaussian over the mask's cells alone: weights are renormalised rather than letting the
// transparent cells around the silhouette darken its edge. The radius is its sigma, in cells.
// From three cells up it's three box blurs in a row, which come out all but the same.
function blurFigure(
  values: Float32Array,
  { figure, columns, rows }: Pick<Cells, "figure" | "columns" | "rows">,
  radius: number,
) {
  let blurring: Blurring = [new Float32Array(columns * rows), new Float32Array(columns * rows)];
  for (let cell = 0; cell < figure.length; cell++) {
    if (figure[cell]) {
      blurring[0][cell] = values[cell];
      blurring[1][cell] = 1;
    }
  }

  if (radius >= 3) {
    const reach = Math.round((Math.sqrt(4 * radius * radius + 1) - 1) / 2);
    for (let pass = 0; pass < 3; pass++) {
      blurring = boxBoth(blurring, columns, rows, reach);
    }
  } else {
    const reach = Math.ceil(radius * 2);
    const kernel = Array.from({ length: reach * 2 + 1 }, (_, index) =>
      Math.exp(-((index - reach) ** 2) / (2 * radius * radius)),
    );
    blurring = kernelColumns(kernelRows(blurring, columns, rows, kernel), columns, rows, kernel);
  }

  const [sums, weights] = blurring;
  const blurred = new Float32Array(columns * rows);
  for (let cell = 0; cell < blurred.length; cell++) {
    if (figure[cell]) {
      blurred[cell] = sums[cell] / weights[cell];
    }
  }
  return blurred;
}

// CLAHE: each region of the figure gets its own histogram equalization, its slope held
// down by the clip limit, and every cell reads between its four nearest regions so no
// seams show. Only blended in lightly: on its own it evens out the whole picture.
function equalizeLocally(
  values: Float32Array,
  { figure, columns, rows }: Cells,
  { claheRegions: [across, down], claheClipLimit: clipLimit, claheBlend }: MosaicTuning["tone"],
) {
  let minColumn = columns;
  let maxColumn = 0;
  let minRow = rows;
  let maxRow = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (figure[row * columns + column]) {
        minColumn = Math.min(minColumn, column);
        maxColumn = Math.max(maxColumn, column);
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
      }
    }
  }

  const regionWidth = (maxColumn - minColumn + 1) / across;
  const regionHeight = (maxRow - minRow + 1) / down;
  const binOf = (value: number) => Math.min(Math.floor(value * HISTOGRAM_BINS), HISTOGRAM_BINS - 1);
  const curves = new Float32Array(across * down * HISTOGRAM_BINS);
  const counts = new Uint32Array(across * down);

  for (let row = minRow; row <= maxRow; row++) {
    for (let column = minColumn; column <= maxColumn; column++) {
      const cell = row * columns + column;
      if (figure[cell]) {
        const regionX = Math.min(Math.floor((column - minColumn) / regionWidth), across - 1);
        const regionY = Math.min(Math.floor((row - minRow) / regionHeight), down - 1);
        const region = regionY * across + regionX;
        curves[region * HISTOGRAM_BINS + binOf(values[cell])]++;
        counts[region]++;
      }
    }
  }

  for (let region = 0; region < counts.length; region++) {
    const offset = region * HISTOGRAM_BINS;
    const total = counts[region];
    if (total === 0) {
      for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
        curves[offset + bin] = (bin + 0.5) / HISTOGRAM_BINS;
      }
      continue;
    }

    // A region with hardly any cells clips nearly all of them, which leaves it as is.
    const limit = (clipLimit * total) / HISTOGRAM_BINS;
    let excess = 0;
    for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
      excess += Math.max(curves[offset + bin] - limit, 0);
    }
    const share = excess / HISTOGRAM_BINS;
    let running = 0;
    for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
      running += Math.min(curves[offset + bin], limit) + share;
      curves[offset + bin] = running / total;
    }
  }

  const equalized = new Float32Array(columns * rows);
  const curve = (regionX: number, regionY: number, bin: number) =>
    curves[(regionY * across + regionX) * HISTOGRAM_BINS + bin];
  for (let row = minRow; row <= maxRow; row++) {
    const placeY = (row - minRow + 0.5) / regionHeight - 0.5;
    const y0 = Math.max(Math.floor(placeY), 0);
    const y1 = Math.min(Math.floor(placeY) + 1, down - 1);
    const shareY = placeY - Math.floor(placeY);

    for (let column = minColumn; column <= maxColumn; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }
      const placeX = (column - minColumn + 0.5) / regionWidth - 0.5;
      const x0 = Math.max(Math.floor(placeX), 0);
      const x1 = Math.min(Math.floor(placeX) + 1, across - 1);
      const shareX = placeX - Math.floor(placeX);
      const bin = binOf(values[cell]);
      const upper = curve(x0, y0, bin) * (1 - shareX) + curve(x1, y0, bin) * shareX;
      const lower = curve(x0, y1, bin) * (1 - shareX) + curve(x1, y1, bin) * shareX;
      const value = upper * (1 - shareY) + lower * shareY;
      equalized[cell] = values[cell] + (value - values[cell]) * claheBlend;
    }
  }
  return equalized;
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(from: number, to: number, value: number) {
  const progress = clamp01((value - from) / (to - from));
  return progress * progress * (3 - 2 * progress);
}

// Less towards either end, which keeps local contrast and grain out of the deep shadows and
// the clean highlights.
function midtoneWeight(tone: number) {
  return 1 - Math.abs(2 * tone - 1);
}

// Each cell's median among itself and its neighbours in the figure, where it is only a small step
// from it. A bigger step is an eye, a nostril or the line of the lips, two or three cells across
// here, and a plain median would take those out along with the noise.
function medianFigure(
  values: Float32Array,
  { figure, columns, rows }: Cells,
  reach: number,
  limit: number,
) {
  const filtered = Float32Array.from(values);
  const window = new Float32Array((reach * 2 + 1) ** 2);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }
      let size = 0;
      for (let y = Math.max(row - reach, 0); y <= Math.min(row + reach, rows - 1); y++) {
        for (let x = Math.max(column - reach, 0); x <= Math.min(column + reach, columns - 1); x++) {
          if (figure[y * columns + x]) {
            // Kept in order as it fills: a sort call per cell is most of the cost otherwise.
            const value = values[y * columns + x];
            let place = size++;
            while (place > 0 && window[place - 1] > value) {
              window[place] = window[place - 1];
              place--;
            }
            window[place] = value;
          }
        }
      }
      const median = window[size >> 1];
      const step = values[cell] - median;
      filtered[cell] = median + step * smoothstep(limit, limit * 2, Math.abs(step));
    }
  }
  return filtered;
}

// Levels on the figure's percentiles, then a global histogram equalization with its slope held
// under tone.balance times even. The shirt is most of the figure in about 8 levels out of 255,
// so it takes that much more of the range than it had, and no more: the rest of what plain
// equalization would have given it goes to everything else, the face's skin included.
function setRange(
  values: Float32Array,
  { figure }: Cells,
  tone: MosaicTuning["tone"],
  curve: (tone: number) => number,
) {
  const sorted = values.filter((_, cell) => figure[cell]).sort();
  const percentile = (percent: number) =>
    sorted[Math.min(Math.floor((percent / 100) * sorted.length), sorted.length - 1)];
  const black = percentile(tone.blackPoint);
  const span = Math.max(percentile(tone.whitePoint) - black, 1e-3);
  const level = (value: number) => clamp01((value - black) / span);

  const histogram = new Float32Array(HISTOGRAM_BINS);
  const binOf = (value: number) => Math.min(Math.floor(value * HISTOGRAM_BINS), HISTOGRAM_BINS - 1);
  for (const value of sorted) {
    histogram[binOf(level(value))]++;
  }
  const limit = (tone.balance * sorted.length) / HISTOGRAM_BINS;
  let excess = 0;
  for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
    excess += Math.max(histogram[bin] - limit, 0);
  }
  // Where each bin starts on the way out. Read in between, so a band only a few bins wide
  // still comes out as a smooth run of tone rather than a few steps.
  const starts = new Float32Array(HISTOGRAM_BINS + 1);
  for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
    const share = Math.min(histogram[bin], limit) + excess / HISTOGRAM_BINS;
    starts[bin + 1] = starts[bin] + share / sorted.length;
  }

  const ranged = new Float32Array(values.length);
  for (let cell = 0; cell < values.length; cell++) {
    if (figure[cell]) {
      const place = level(values[cell]) * HISTOGRAM_BINS;
      const bin = Math.min(Math.floor(place), HISTOGRAM_BINS - 1);
      ranged[cell] = curve(starts[bin] + (starts[bin + 1] - starts[bin]) * (place - bin));
    }
  }
  return ranged;
}

// A contrast sigmoid around the middle, stretched back out to fill 0-1, so the shadows and
// highlights roll off rather than clip. Contrast is its slope at the middle, near enough.
function filmicCurve(contrast: number) {
  const steepness = (contrast - 1) * 13;
  if (steepness < 0.01) {
    return (tone: number) => tone;
  }
  const sigmoid = (tone: number) => 1 / (1 + Math.exp(-steepness * (tone - 0.5)));
  const low = sigmoid(0);
  const span = sigmoid(1) - low;
  return (tone: number) => (sigmoid(tone) - low) / span;
}

// Cells to the nearest source cell, by a two-pass chamfer. Nothing past the grid counts as a
// source, which is what keeps the box's bottom edge, only a crop, from reading as the figure's.
function distanceFrom(sources: Uint8Array, columns: number, rows: number) {
  const distance = new Float32Array(sources.length);
  for (let cell = 0; cell < distance.length; cell++) {
    distance[cell] = sources[cell] ? 0 : columns + rows;
  }
  const diagonal = Math.SQRT2;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      let best = distance[cell];
      if (column > 0) {
        best = Math.min(best, distance[cell - 1] + 1);
      }
      if (row > 0) {
        const above = cell - columns;
        best = Math.min(best, distance[above] + 1);
        if (column > 0) {
          best = Math.min(best, distance[above - 1] + diagonal);
        }
        if (column < columns - 1) {
          best = Math.min(best, distance[above + 1] + diagonal);
        }
      }
      distance[cell] = best;
    }
  }
  for (let row = rows - 1; row >= 0; row--) {
    for (let column = columns - 1; column >= 0; column--) {
      const cell = row * columns + column;
      let best = distance[cell];
      if (column < columns - 1) {
        best = Math.min(best, distance[cell + 1] + 1);
      }
      if (row < rows - 1) {
        const below = cell + columns;
        best = Math.min(best, distance[below] + 1);
        if (column < columns - 1) {
          best = Math.min(best, distance[below + 1] + diagonal);
        }
        if (column > 0) {
          best = Math.min(best, distance[below - 1] + diagonal);
        }
      }
      distance[cell] = best;
    }
  }
  return distance;
}

// The key light: on the face's skin, nudged up towards the eyes and then towards whichever side
// the photo is already lit from. Inside the inner radius, which takes in the face, it does nothing.
function placeKeyLight({ brightness, figure, columns }: Cells, face: number[]) {
  let sumColumn = 0;
  let sumRow = 0;
  let top = Infinity;
  let bottom = 0;
  for (const cell of face) {
    const column = cell % columns;
    const row = (cell - column) / columns;
    sumColumn += column;
    sumRow += row;
    top = Math.min(top, row);
    bottom = Math.max(bottom, row);
  }
  const centerColumn = sumColumn / face.length;
  const centerRow = sumRow / face.length - (bottom - top) * 0.1;

  let outer = 0;
  for (let cell = 0; cell < figure.length; cell++) {
    if (figure[cell]) {
      const column = cell % columns;
      const row = (cell - column) / columns;
      outer = Math.max(outer, Math.hypot(column - centerColumn, row - centerRow));
    }
  }

  // By 8% of its reach, all of it once one half of the face is 0.02 brighter than the other.
  const sums = [0, 0];
  const counts = [0, 0];
  for (const cell of face) {
    const side = cell % columns < centerColumn ? 0 : 1;
    sums[side] += brightness[cell];
    counts[side]++;
  }
  const difference = sums[1] / (counts[1] || 1) - sums[0] / (counts[0] || 1);
  const shift = Math.min(Math.max(difference / 0.02, -1), 1) * 0.08 * outer;

  return {
    column: centerColumn + shift,
    row: centerRow,
    inner: centerRow - top + Math.abs(shift),
    outer,
  };
}

// Dodge and burn, all of it by taking tone away, so nothing here adds a colour or a rim. The
// photo's face is evenly lit and the brightest thing in the figure, so on its own it sits in the
// top fifth of the ramp with nothing to model it. Its shadows go deeper by their distance from
// its highlights, which stay where they are, and the hair is burnt down to frame it.
function lightFigure(
  values: Float32Array,
  cells: Cells,
  { face, hair }: Pick<Regions, "face" | "hair">,
  tone: MosaicTuning["tone"],
) {
  const { figure, columns, rows } = cells;
  const { falloff } = tone.keyLight;
  const light = face.length ? placeKeyLight(cells, face) : null;
  const edge = distanceFrom(
    figure.map((inside) => (inside ? 0 : 1)),
    columns,
    rows,
  );
  // Soft, or the hairline and the jaw would show as a step.
  const burn = blurFigure(Float32Array.from(hair), cells, 1);
  const faceMask = new Float32Array(values.length);
  for (const cell of face) {
    faceMask[cell] = 1;
  }
  const modeled = blurFigure(faceMask, cells, 2);
  const lit = new Float32Array(values.length);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }
      let level = 1 - (1 - values[cell]) * (1 + tone.faceDepth * modeled[cell]);
      level *= 1 - burn[cell] * tone.hairBurn;
      if (light) {
        const distance = Math.hypot(column - light.column, row - light.row);
        level *= 1 - falloff * smoothstep(light.inner, light.outer, distance);
      }
      // The outermost cells are 1 from the nearest cell outside.
      const rim = 1 - (edge[cell] - 1) / tone.edgeBurnCells;
      if (rim > 0) {
        level *= 1 - tone.edgeBurn * rim * rim;
      }
      lit[cell] = level;
    }
  }
  return { lit, edge, face: modeled };
}

// How steeply the tone changes at each cell, per cell, reading across the figure alone.
function edgeStrength(values: Float32Array, { figure, columns, rows }: Cells) {
  const strength = new Float32Array(values.length);
  for (let row = 1; row < rows - 1; row++) {
    for (let column = 1; column < columns - 1; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }
      const read = (offset: number) =>
        figure[cell + offset] ? values[cell + offset] : values[cell];
      strength[cell] = Math.hypot((read(1) - read(-1)) / 2, (read(columns) - read(-columns)) / 2);
    }
  }
  return strength;
}

// Every cell's tone and how strong an edge it's on, the shirt's light before the key light falls
// off, for the accent, and where the face and the silhouette's edge are, for the light theme's
// dots. The last two steps, the grain and the bottom fade, belong to each tile.
function toneMap(cells: Cells, regions: Regions, tone: MosaicTuning["tone"]) {
  const { figure } = cells;
  const curve = filmicCurve(tone.contrast);
  const cleaned = tone.denoise
    ? medianFigure(cells.brightness, cells, tone.denoise, tone.denoiseLimit)
    : cells.brightness;
  const ranged = setRange(cleaned, cells, tone, curve);

  const soft = blurFigure(ranged, cells, tone.clarityRadius);
  const clear = new Float32Array(ranged.length);
  for (let cell = 0; cell < clear.length; cell++) {
    if (figure[cell]) {
      const local = tone.clarity * midtoneWeight(ranged[cell]) * (ranged[cell] - soft[cell]);
      clear[cell] = clamp01(ranged[cell] + local);
    }
  }

  const shaped = tone.claheBlend > 0 ? equalizeLocally(clear, cells, tone) : clear;
  const { lit, edge, face } = lightFigure(shaped, cells, regions, tone);
  const detail = edgeStrength(lit, cells);
  const unsharp = blurFigure(lit, cells, 1);
  const finished = new Float32Array(lit.length);
  for (let cell = 0; cell < finished.length; cell++) {
    if (figure[cell]) {
      // Eased in above the threshold, so where it starts doesn't show as a speckle of its own.
      const { sharpen, edgeThreshold } = tone;
      const amount = sharpen * smoothstep(edgeThreshold, edgeThreshold * 1.5, detail[cell]);
      finished[cell] = clamp01(lit[cell] + amount * (lit[cell] - unsharp[cell]));
    }
  }
  return { tone: finished, detail, shirtLight: shaped, edge, face };
}

// The settings the light theme's tone is made with, in place of the ones above.
function lightTone({ light, ...tone }: MosaicTuning["tone"]): MosaicTuning["tone"] {
  const { clarity, sharpen, faceDepth } = light;
  return { ...tone, light, clarity, sharpen, faceDepth };
}

// The share of its cell an ink dot has to cover for the cell to come out the right lightness to
// the eye, which adds light up, not lightness. The tone runs from the ink (0) to the page (1).
function dotCoverage(tone: number, { ink, page }: { ink: number; page: number }) {
  const lightness = ink + clamp01(tone) * (page - ink);
  return clamp01((page ** 3 - lightness ** 3) / (page ** 3 - ink ** 3));
}

// How much of its cell a light-theme dot covers, from the tone of its cell: an ink dot grows with
// darkness and a highlight prints nothing. Three things hold it up where it would be too small to
// read: the face's midtones keep a smallest dot, so does the T-shirt, and so does the silhouette's
// edge.
function printedCoverage(
  tone: number,
  face: number,
  edge: number,
  onShirt: boolean,
  palette: { ink: number; page: number },
  { light }: MosaicTuning["tone"],
  curve: (tone: number) => number,
) {
  const shade = curve(tone);
  const printed = 1 - smoothstep(light.openFrom, light.openTo, shade);
  const midtone =
    face * light.midtoneDot * (1 - smoothstep(light.openFrom - 0.06, light.openTo, shade));
  const rim = Math.max(1 - (edge - 1) / light.contourCells, 0);
  const shirt = onShirt ? light.shirtDot : 0;
  return Math.max(dotCoverage(shade, palette) * printed, midtone, shirt, light.contour * rim * rim);
}

// Flood-fills the first sizeable patch from the top. Of warm cells, that is the face: the arms
// are warm too, but the shirt cuts them off from it. Of dark cells, it is the hair.
function firstPatch(mask: Uint8Array, columns: number, rows: number, minCells: number) {
  const size = columns * rows;
  const seen = new Uint8Array(size);
  const stack = new Int32Array(size);

  for (let start = 0; start < size; start++) {
    if (!mask[start] || seen[start]) {
      continue;
    }

    const patch: number[] = [];
    let depth = 0;
    stack[depth++] = start;
    seen[start] = 1;
    while (depth > 0) {
      const cell = stack[--depth];
      patch.push(cell);
      const column = cell % columns;
      const next = [
        column > 0 ? cell - 1 : -1,
        column < columns - 1 ? cell + 1 : -1,
        cell - columns,
        cell + columns,
      ];
      for (const other of next) {
        if (other >= 0 && other < size && mask[other] && !seen[other]) {
          seen[other] = 1;
          stack[depth++] = other;
        }
      }
    }
    if (patch.length >= minCells) {
      return patch;
    }
  }
  return [];
}

function classifyRegions(cells: Cells) {
  const { figure, red, green, blue, brightness, columns, rows, count } = cells;
  const { skinFrom, hairBelow, outlineCells, faceShare } = MOSAIC.masks;
  const size = columns * rows;
  const regions = new Uint8Array(size);
  const warm = new Uint8Array(size);

  for (let cell = 0; cell < size; cell++) {
    if (figure[cell] && red[cell] > green[cell] && green[cell] > blue[cell]) {
      warm[cell] = brightness[cell] >= skinFrom ? 1 : 0;
    }
  }

  // Per column of the face: its first and last cell. Everything between them counts as
  // skin, which takes in the brows, eyes, nostrils and lips that are too dark to be warm.
  const dark = figure.map((inside, cell) => (inside && brightness[cell] < hairBelow ? 1 : 0));
  const hair = new Uint8Array(size);
  for (const cell of firstPatch(dark, columns, rows, count * faceShare)) {
    hair[cell] = 1;
  }

  const face = firstPatch(warm, columns, rows, count * faceShare);
  const first = new Int32Array(columns).fill(-1);
  const last = new Int32Array(columns).fill(-1);
  let faceTop = 0;
  for (const cell of face) {
    const column = cell % columns;
    const row = (cell - column) / columns;
    first[column] = first[column] < 0 ? row : Math.min(first[column], row);
    last[column] = Math.max(last[column], row);
  }
  if (face.length) {
    faceTop = Math.min(...first.filter((row) => row >= 0));
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }

      const inFaceColumn = first[column] >= 0;
      if (hair[cell]) {
        regions[cell] = HAIR;
      } else if (inFaceColumn && row < first[column]) {
        // Light strands up here are nothing rather than skin, whatever their hue.
        regions[cell] = brightness[cell] < hairBelow ? HAIR : 0;
      } else if (inFaceColumn && row <= last[column]) {
        regions[cell] = SKIN;
      } else if (warm[cell]) {
        regions[cell] = SKIN;
      } else if (blue[cell] > red[cell] && row > faceTop) {
        regions[cell] = SHIRT;
      }
    }
  }

  // The bottom of the box only crops the figure, so it isn't an edge of the silhouette.
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      if (!figure[cell]) {
        continue;
      }
      search: for (let dy = -outlineCells; dy <= outlineCells; dy++) {
        for (let dx = -outlineCells; dx <= outlineCells; dx++) {
          const x = column + dx;
          const y = row + dy;
          const outside = x < 0 || x >= columns || y < 0;
          if (outside || (y < rows && !figure[y * columns + x])) {
            regions[cell] = OUTLINE;
            break search;
          }
        }
      }
    }
  }
  // The face's skin alone, for the key light: the hair's lighter strands can be warm too.
  return { regions, hair, face: face.filter((cell) => !hair[cell]) };
}

// By percentile of the T-shirt's own cells, so it adapts to any photo and screen size. Its
// brightest cells against their surroundings are the raised ridges of its folds, where the
// photo's broader light would only pick out one side of the chest. They mix towards the accent by
// how bright they are, and the blur turns that into soft patches: a ridge one cell wide comes out
// of it faint, and only a broad one reaches full.
// Nothing here is random, so a rebuild at the same size places exactly the same tiles.
function placeAccent(
  light: Float32Array,
  regions: Uint8Array,
  { columns, rows }: Cells,
  { shirtHighlightPercent, fullPercent, hemBand, foldRadius }: MosaicTuning["accent"],
) {
  const size = regions.length;
  const accent = new Uint8Array(size);
  const skin = new Uint8Array(size);
  for (let cell = 0; cell < size; cell++) {
    skin[cell] = regions[cell] === SKIN ? 1 : 0;
  }
  const fromSkin = distanceFrom(skin, columns, rows);
  const open = new Uint8Array(size);
  let openCount = 0;
  for (let cell = 0; cell < size; cell++) {
    if (regions[cell] === SHIRT && fromSkin[cell] > hemBand) {
      open[cell] = 1;
      openCount++;
    }
  }
  // Each open cell's values, in order, for their percentiles.
  const gather = (values: Float32Array) => {
    const gathered = new Float32Array(openCount);
    let index = 0;
    for (let cell = 0; cell < size; cell++) {
      if (open[cell]) {
        gathered[index++] = values[cell];
      }
    }
    return gathered.sort();
  };

  const surroundings = blurFigure(light, { figure: open, columns, rows }, foldRadius);
  const raised = new Float32Array(size);
  for (let cell = 0; cell < size; cell++) {
    if (open[cell]) {
      raised[cell] = light[cell] - surroundings[cell];
    }
  }
  const sorted = gather(raised);
  if (!sorted.length) {
    return accent;
  }

  const top = (percent: number, values: Float32Array) =>
    values[Math.min(Math.floor(values.length * (1 - percent / 100)), values.length - 1)];
  const softFrom = top(shirtHighlightPercent, sorted);
  const span = Math.max(top(fullPercent, sorted) - softFrom, 1e-4);
  const selected = new Float32Array(regions.length);
  for (let cell = 0; cell < regions.length; cell++) {
    if (open[cell]) {
      selected[cell] = clamp01((raised[cell] - softFrom) / span);
    }
  }

  const soft = blurFigure(selected, { figure: open, columns, rows }, 1);
  const full = top(fullPercent, gather(soft)) || 1;
  for (let cell = 0; cell < regions.length; cell++) {
    if (open[cell]) {
      accent[cell] =
        soft[cell] >= full ? ACCENT_FULL : Math.round((soft[cell] / full) * ACCENT_STEPS);
    }
  }

  // Full accent only comes in blocks of at least two by two. A cell of it on its own, or the
  // step at the edge of a diagonal run, reads as a stray pink dot, so it stays a mix.
  const isFull = (column: number, row: number) =>
    column >= 0 &&
    column < columns &&
    row >= 0 &&
    row < rows &&
    accent[row * columns + column] >= ACCENT_FULL;
  const inBlock = (column: number, row: number) =>
    [-1, 0].some((dy) =>
      [-1, 0].some(
        (dx) =>
          isFull(column + dx, row + dy) &&
          isFull(column + dx + 1, row + dy) &&
          isFull(column + dx, row + dy + 1) &&
          isFull(column + dx + 1, row + dy + 1),
      ),
    );
  const stray: number[] = [];
  for (let cell = 0; cell < accent.length; cell++) {
    if (accent[cell] === ACCENT_FULL && !inBlock(cell % columns, Math.floor(cell / columns))) {
      stray.push(cell);
    }
  }
  for (const cell of stray) {
    accent[cell] = ACCENT_STEPS;
  }
  return accent;
}

// A hash of the cell rather than Math.random, so a rebuild comes out the same.
function cellNoise(column: number, row: number) {
  let hash = Math.imul(column + 1, 0x9e3779b1) ^ Math.imul(row + 1, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 0x100000000;
}

function easeReveal(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function toCss([red, green, blue]: Rgb) {
  return `rgb(${Math.round(red)},${Math.round(green)},${Math.round(blue)})`;
}

function mixRgb(from: Rgb, to: Rgb, share: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share,
    from[2] + (to[2] - from[2]) * share,
  ];
}

function toLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number) {
  const encoded = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return clamp01(encoded) * 255;
}

function toOklab([red, green, blue]: Rgb): Rgb {
  const r = toLinear(red);
  const g = toLinear(green);
  const b = toLinear(blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([lightness, a, b]: Rgb): Rgb {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

// What color-mix(in oklab, from, to share) gives for two opaque colours.
function mixOklab(from: Rgb, to: Rgb, share: number): Rgb {
  return fromOklab(mixRgb(toOklab(from), toOklab(to), share));
}

function rampColor(stops: RampStop[], tone: number) {
  const next = stops.findIndex((stop) => stop.at >= tone);
  if (next === 0 || next === -1) {
    return next === 0 ? stops[0].rgb : stops[stops.length - 1].rgb;
  }
  const from = stops[next - 1];
  const to = stops[next];
  return mixOklab(from.rgb, to.rgb, (tone - from.at) / (to.at - from.at));
}

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  const read = (token: string): Rgb => {
    if (!context) {
      return [0, 0, 0];
    }
    context.fillStyle = styles.getPropertyValue(token).trim();
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    return [red, green, blue];
  };

  const isDark = document.documentElement.classList.contains("dark");
  const ink: RampStopConfig[] = [{ at: 0, token: "--foreground", alpha: 1 }];
  const ramp: readonly RampStopConfig[] = isDark ? MOSAIC.color.dark.ramp : ink;
  const ground = read("--background");
  // Flattened on to the page, which is what the silhouette puts under every tile. Opaque
  // colours are what let a tile be mixed towards the accent ahead of time.
  const stops = ramp.map(({ at, token, alpha }) => ({
    at,
    rgb: mixRgb(ground, read(token), alpha),
  }));

  return {
    dark: isDark,
    stops,
    accent: read("--accent"),
    ground: toCss(ground),
    dust: toCss(read(MOSAIC.dust.token)),
    // Lightness in OKLab of the ink and the page its dots are on, in the theme that prints.
    print: isDark ? null : { ink: toOklab(stops[0].rgb)[0], page: toOklab(ground)[0] },
  };
}

// ?mosaicDebug=detail|regions|tone in development: what the pipeline decided, on the grid.
function paintDebugLayer(
  mode: string,
  { figure, columns, rows, pitch, tileSize }: Cells & { pitch: number; tileSize: number },
  { tone, detail }: { tone: Float32Array; detail: Float32Array },
  regions: Uint8Array,
) {
  if (!["detail", "regions", "tone"].includes(mode)) {
    return null;
  }

  const layer = document.createElement("canvas");
  layer.width = columns * pitch;
  layer.height = rows * pitch;
  const context = layer.getContext("2d");
  if (!context) {
    return null;
  }

  const sorted = Float32Array.from(detail.filter((_, cell) => figure[cell])).sort();
  const peak = sorted[Math.floor(sorted.length * 0.99)] || 1;
  const regionColors = ["#6b7280", "#f0a878", "#2f6fed", "#a25bf0", "#27c46b"];
  const colorOf = (cell: number) => {
    if (mode === "regions") {
      return regionColors[regions[cell]];
    }
    if (mode === "tone") {
      const grey = Math.round(tone[cell] * 255);
      return `rgb(${grey},${grey},${grey})`;
    }
    const heat = Math.min(detail[cell] / peak, 1);
    return `hsl(${250 - 250 * heat} 90% ${12 + 48 * heat}%)`;
  };

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = row * columns + column;
      if (figure[cell]) {
        context.fillStyle = colorOf(cell);
        context.fillRect(column * pitch, row * pitch, tileSize, tileSize);
      }
    }
  }
  return layer;
}

// The flight, as instanced quads: every tile in the air at once is too many separate draw
// calls for a 2D canvas on an integrated GPU, and here it's one call a frame, with all the
// motion worked out from the tile's own start, target and delay in the vertex shader.
const FLIGHT_VERTEX = (colorCount: number) => `#version 300 es
in vec2 corner;
in float startX;
in float startY;
in float targetX;
in float targetY;
in float startRotation;
in float delay;
in float fade;
in float shrink;
in float colorIndex;
uniform vec2 resolution;
uniform float time;
uniform float flight;
uniform float tileSize;
// 1 in the light theme, whose dots reach a tenth of a pixel and past a tile's own size.
uniform float print;
uniform vec3 colors[${colorCount}];
out vec4 color;
out vec2 local;
out float halfSize;

void main() {
  float progress = (time - delay) / flight;
  if (progress <= 0.0 || (print > 0.5 && shrink <= 0.0)) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // expo.out, and exactly 1 at the end, which puts a landed tile on its pixels.
  float eased = progress >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * progress);
  halfSize = tileSize * shrink * eased / 2.0;
  local = corner * (halfSize + 1.0);
  float turn = startRotation * (1.0 - eased);
  vec2 axis = vec2(cos(turn), sin(turn));
  // A dot bigger than a tile grows into the gap on one side only, so it stays on the pixels.
  float over = print > 0.5 ? tileSize * max(shrink - 1.0, 0.0) / 2.0 : 0.0;
  vec2 center = mix(vec2(startX, startY), vec2(targetX, targetY), eased) + tileSize / 2.0 + over;
  vec2 place = center + vec2(axis.x * local.x - axis.y * local.y, axis.y * local.x + axis.x * local.y);
  gl_Position = vec4(place / resolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
  float alpha = fade * eased;
  color = vec4(colors[int(colorIndex)] * alpha, alpha);
}`;

// Coverage from the distance to the tile's edge: soft while it is turned or between
// pixels, and exactly all or nothing once it is square on a whole pixel. The light theme's dots
// rarely are, so they're covered the way the 2D canvas does it, by how far a pixel's centre is
// from the dot's edge, and land the same.
const FLIGHT_FRAGMENT = `#version 300 es
precision highp float;
uniform float print;
in vec4 color;
in vec2 local;
in float halfSize;
out vec4 fragment;

void main() {
  vec2 cover = clamp(halfSize + 0.5 - abs(local), 0.0, 1.0);
  vec2 past = abs(local) - halfSize;
  float beyond = length(max(past, 0.0)) + min(max(past.x, past.y), 0.0);
  fragment = color * (print > 0.5 ? clamp(0.5 - beyond, 0.0, 1.0) : cover.x * cover.y);
}`;

function createFlightRenderer(
  canvas: HTMLCanvasElement,
  tiles: Tiles,
  sizes: { tileSize: number; colorCount: number },
  flightSeconds: number,
) {
  const gl = canvas.getContext("webgl2", { antialias: false });
  if (!gl) {
    return null;
  }

  const program = gl.createProgram();
  const shaders = [
    [gl.VERTEX_SHADER, FLIGHT_VERTEX(sizes.colorCount)],
    [gl.FRAGMENT_SHADER, FLIGHT_FRAGMENT],
  ] as const;
  for (const [type, source] of shaders) {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }
  gl.useProgram(program);

  const buffers: (WebGLBuffer | null)[] = [];
  const attribute = (
    name: string,
    data: Float32Array | Uint8Array,
    perTile: boolean,
    components = 1,
  ) => {
    const buffer = gl.createBuffer();
    const location = gl.getAttribLocation(program, name);
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    const type = data instanceof Uint8Array ? gl.UNSIGNED_BYTE : gl.FLOAT;
    gl.vertexAttribPointer(location, components, type, false, 0, 0);
    gl.vertexAttribDivisor(location, perTile ? 1 : 0);
    return buffer;
  };

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  attribute("corner", new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), false, 2);
  attribute("startX", tiles.startX, true);
  attribute("startY", tiles.startY, true);
  attribute("targetX", tiles.targetX, true);
  attribute("targetY", tiles.targetY, true);
  attribute("startRotation", tiles.startRotation, true);
  attribute("delay", tiles.delay, true);
  const fadeBuffer = attribute("fade", tiles.fade, true);
  const shrinkBuffer = attribute("shrink", tiles.shrink, true);
  const colorIndexBuffer = attribute("colorIndex", tiles.colorIndex, true);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const timeAt = uniform("time");
  const printAt = uniform("print");
  gl.uniform2f(uniform("resolution"), canvas.width, canvas.height);
  gl.uniform1f(uniform("flight"), flightSeconds);
  gl.uniform1f(uniform("tileSize"), sizes.tileSize);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return {
    draw(time: number) {
      gl.uniform1f(timeAt, time);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, tiles.count);
    },
    // The same whole numbers the 2D cache is painted in, so nothing shifts at the handoff.
    setColors(colors: Rgb[], print: boolean) {
      const values = colors.flatMap((color) => color.map((value) => Math.round(value) / 255));
      gl.uniform3fv(uniform("colors"), values);
      gl.uniform1f(printAt, print ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorIndexBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, tiles.colorIndex);
      gl.bindBuffer(gl.ARRAY_BUFFER, shrinkBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, tiles.shrink);
      gl.bindBuffer(gl.ARRAY_BUFFER, fadeBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, tiles.fade);
    },
    destroy() {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
    },
  };
}

function createMosaic(
  canvas: HTMLCanvasElement,
  flightCanvas: HTMLCanvasElement,
  image: HTMLImageElement,
  box: HTMLDivElement,
  section: HTMLElement,
  name: HTMLHeadingElement,
): Mosaic {
  const context = canvas.getContext("2d");
  // The mosaic as one image, so a frame only has to draw what differs from it.
  const cache = document.createElement("canvas");
  const cacheContext = cache.getContext("2d");
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isLively = () =>
    !prefersReducedMotion() && !window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const debugMode =
    process.env.NODE_ENV !== "production"
      ? new URLSearchParams(window.location.search).get("mosaicDebug")
      : null;

  let phase: "waiting" | "assembling" | "settled" = "waiting";
  let tiles: Tiles | null = null;
  let tuning: MosaicTuning = { tone: MOSAIC.tone, accent: MOSAIC.accent };
  let palette = readPalette();
  // What each theme makes of this grid, worked out the first time it is shown, and the grid.
  let figureGrid: {
    grid: ReturnType<typeof fitGrid>;
    classified: Regions;
  } | null = null;
  let looks: Partial<
    Record<"dark" | "light", { tone: ReturnType<typeof toneMap>; accent: Uint8Array }>
  > = {};
  // By colour index. Plain colours, then the same again for each step of the mix towards
  // the accent, then the accent.
  let colors: Rgb[] = [];
  let styles: string[] = [];
  let baseCount = 0;
  let colorEnds: number[] = [];
  let built: { box: DOMRect; section: DOMRect; dpr: number } | null = null;
  let dpr = 1;
  let tileSize = 1;
  // Whole device pixels, and the same parity as the tile, so it centres exactly.
  let lively = isLively();
  let timing: Timing = MOSAIC.assemble.quick;
  let flight: gsap.core.Tween | null = null;
  let flightRenderer: ReturnType<typeof createFlightRenderer> = null;
  let entering = false;
  let destroyed = false;
  let onScreen = true;
  let frame = 0;
  let lastFrame = 0;
  let stepBudget = 0;
  let awake = false;
  let stepping = false;
  let pointer: { x: number; y: number } | null = null;
  let pointerMoved = false;
  let activeCount = 0;
  let cacheReady = false;
  // How far the dust and the silhouette under the tiles have faded in.
  let surroundOpacity = 0;
  // Each row's runs of tiles, as x, y, width triples.
  let silhouette: number[] = [];
  let pitch = 1;
  let gridX = 0;
  let gridY = 0;
  let gridColumns = 0;
  let gridRows = 0;
  // Which tile is on each cell, or -1.
  let tileAt = new Int32Array(0);
  let accentTiles = new Uint16Array(0);
  let debugLayer: HTMLCanvasElement | null = null;
  let resizeTimer = 0;
  // Seconds of physics so far, which the tiles under the pointer keep time by.
  let wanderClock = 0;
  let overName = false;
  // Seconds of physics since the pointer came on to the name, which the stagger counts from.
  let revealClock = 0;
  // Which tiles it covers, and the name's offset from the canvas when that was worked out.
  let nameSpan = { left: 0, width: 1 };
  let maskedAt = { x: 0, y: 0 };
  let dustCount: number = MOSAIC.dust.count;
  let copyBounds: { left: number; top: number; right: number; bottom: number }[] = [];
  const maskContext = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });

  const { dust: dustConfig } = MOSAIC;
  const dustFloats = (make: () => number) => Float32Array.from({ length: dustConfig.count }, make);
  const between = ({ min, max }: { readonly min: number; readonly max: number }) =>
    min + Math.random() * (max - min);
  // A share of the hero rather than pixels, so a resize doesn't reshuffle them.
  const dust = {
    x: dustFloats(() => Math.random()),
    y: dustFloats(() => Math.random()),
    vx: dustFloats(() => (Math.random() * 2 - 1) * dustConfig.drift),
    vy: dustFloats(() => (Math.random() * 2 - 1) * dustConfig.drift),
    // Where in the theme's range of opacities, 0-1.
    shade: dustFloats(() => Math.random()),
    phase: dustFloats(() => Math.random() * Math.PI * 2),
    rate: dustFloats(() => between(dustConfig.twinkle)),
  };

  const twinkles = Array.from({ length: MOSAIC.idle.twinkle.count }, () => ({
    tile: 0,
    start: -1,
    duration: 0,
  }));

  const assignColors = () => {
    if (!tiles) {
      return;
    }

    const { count, tone, jitter, order, accent, colorIndex } = tiles;
    const { levels } = tuning.tone;

    const base = Array.from({ length: levels }, (_, level) =>
      rampColor(palette.stops, (level + 0.5) / levels),
    );
    for (let tile = 0; tile < count; tile++) {
      const jittered = tone[tile] * (1 + jitter[tile]);
      colorIndex[tile] = Math.min(Math.max(Math.floor(jittered * levels), 0), levels - 1);
    }

    baseCount = base.length;
    for (let tile = 0; tile < count; tile++) {
      colorIndex[tile] =
        accent[tile] === ACCENT_FULL
          ? baseCount * ACCENT_FULL
          : colorIndex[tile] + baseCount * accent[tile];
    }

    const { maxMix } = tuning.accent;
    const mixed = Array.from({ length: ACCENT_STEPS }, (_, step) =>
      base.map((color) => mixOklab(color, palette.accent, (maxMix * (step + 1)) / ACCENT_STEPS)),
    );
    colors = [...base, ...mixed.flat(), palette.accent];
    styles = colors.map(toCss);

    const sizes = new Array<number>(colors.length).fill(0);
    for (let tile = 0; tile < count; tile++) {
      sizes[colorIndex[tile]]++;
    }
    colorEnds = [];
    const cursors: number[] = [];
    sizes.reduce((start, size) => {
      cursors.push(start);
      colorEnds.push(start + size);
      return start + size;
    }, 0);
    for (let tile = 0; tile < count; tile++) {
      order[cursors[colorIndex[tile]]++] = tile;
    }
  };

  const lookFor = (dark: boolean) => {
    const theme = dark ? "dark" : "light";
    let look = looks[theme];
    if (!look && figureGrid) {
      const { grid, classified } = figureGrid;
      const tone = toneMap(grid, classified, dark ? tuning.tone : lightTone(tuning.tone));
      const accent = placeAccent(tone.shirtLight, classified.regions, grid, tuning.accent);
      look = looks[theme] = { tone, accent };
    }
    return look;
  };

  // Gives every tile what its theme makes of it: how its cell's tone comes out, its share of the
  // accent, and how big it is. Dark, a tile is whole and changes colour. Light, a tile is ink
  // and a dot, from nothing on a highlight to the whole cell in the shadows.
  const dress = () => {
    const look = lookFor(palette.dark);
    if (!tiles || !figureGrid || !look) {
      return;
    }

    const { grid, classified } = figureGrid;
    const { columns, rows } = grid;
    const { tone, accent } = look;
    const { jitter: grain, bottomFade, light } = tuning.tone;
    const curve = filmicCurve(light.printContrast);
    const fadeFrom = palette.print ? light.fadeFrom : MOSAIC.fadeFrom;
    const accented: number[] = [];
    const biggest = pitch * light.maxDot;

    for (let tile = 0; tile < tiles.count; tile++) {
      const cell = tiles.cell[tile];
      const column = cell % columns;
      const row = (cell - column) / columns;
      tiles.tone[tile] = tone.tone[cell];
      tiles.jitter[tile] =
        (cellNoise(column, row) * 2 - 1) * grain * midtoneWeight(tone.tone[cell]);
      tiles.accent[tile] = accent[cell];
      if (accent[cell]) {
        accented.push(tile);
      }

      const fading = clamp01((row / rows - fadeFrom) / (1 - fadeFrom));
      if (palette.print) {
        // An accent tile never prints smaller than a tile, or it would lose its colour.
        const least = accent[cell] ? (tileSize / biggest) ** 2 : 0;
        const coverage = Math.max(
          printedCoverage(
            tiles.tone[tile] * (1 + tiles.jitter[tile]),
            tone.face[cell],
            tone.edge[cell],
            classified.regions[cell] === SHIRT,
            palette.print,
            tuning.tone,
            curve,
          ),
          least,
        );
        // The way a halftone fades: the dots shrink, with nothing lost to alpha.
        const size = biggest * Math.sqrt(coverage * (1 - smoothstep(0, 1, fading)));
        // Under a pixel, a dot is a whole one with the share of the ink it would have covered,
        // and the smallest print nothing.
        tiles.shrink[tile] = size < MOSAIC.minDot * pitch ? 0 : Math.max(size, 1) / tileSize;
        tiles.fade[tile] = Math.min(size * size, 1);
      } else {
        // The dots shrink first, and only then lose their ink.
        tiles.shrink[tile] = 1 - (1 - bottomFade.minScale) * fading;
        tiles.fade[tile] = 1 - smoothstep(0.35, 1, fading);
      }
    }

    accentTiles = Uint16Array.from(accented);
    twinkles.forEach((twinkle) => {
      twinkle.start = -1;
    });
    assignColors();
  };

  // The canvas is stretched from the portrait's box out to the section's edges, since
  // tiles fly in from across the hero. Layout offsets, not rects: those include the
  // parallax, which would pull the grid off the box it was sampled from. Sized from
  // the backing store, so one canvas pixel is exactly one device pixel, and
  // image-rendering keeps it that way under the parallax's fractional offsets.
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

    canvas.width = Math.round(section.offsetWidth * dpr);
    canvas.height = Math.round(section.offsetHeight * dpr);
    canvas.style.left = `${-originX}px`;
    canvas.style.top = `${-originY}px`;
    canvas.style.width = `${canvas.width / dpr}px`;
    canvas.style.height = `${canvas.height / dpr}px`;

    return { originX, originY };
  };

  const buildTiles = (
    source: Source,
    boxWidth: number,
    boxHeight: number,
    originX: number,
    originY: number,
  ) => {
    const grid = fitGrid(source, boxWidth, boxHeight, dpr);
    const { columns, rows, marginX, marginY, figure, count } = grid;
    const classified = classifyRegions(grid);
    const { regions } = classified;
    const next = createTiles(count);
    const offsetX = Math.round(originX * dpr) + marginX;
    const offsetY = Math.round(originY * dpr) + marginY;
    const focusColumn = MOSAIC.focus.x * columns;
    const focusRow = MOSAIC.focus.y * rows;
    let farthest = 1;
    let tile = 0;

    pitch = grid.pitch;
    tileSize = grid.tileSize;
    gridX = offsetX;
    gridY = offsetY;
    gridColumns = columns;
    gridRows = rows;
    silhouette = [];
    tileAt = new Int32Array(columns * rows).fill(-1);

    for (let row = 0; row < rows; row++) {
      let inRun = false;
      for (let column = 0; column < columns; column++) {
        const cell = row * columns + column;
        if (!figure[cell]) {
          inRun = false;
          continue;
        }

        tileAt[cell] = tile;
        next.cell[tile] = cell;
        next.targetX[tile] = offsetX + column * pitch;
        next.targetY[tile] = offsetY + row * pitch;
        next.seed[tile] = cellNoise(row, column);

        if (inRun) {
          silhouette[silhouette.length - 1] += pitch;
        } else {
          silhouette.push(next.targetX[tile], next.targetY[tile], pitch);
          inRun = true;
        }

        const reach = Math.hypot(column - focusColumn, row - focusRow);
        next.reach[tile] = reach;
        farthest = Math.max(farthest, reach);
        tile++;
      }
    }

    for (let index = 0; index < next.count; index++) {
      next.reach[index] /= farthest;
    }

    activeCount = 0;
    cacheReady = false;
    tiles = next;
    cache.width = columns * pitch;
    cache.height = rows * pitch;
    figureGrid = { grid, classified };
    looks = {};
    dress();

    if (process.env.NODE_ENV !== "production" && debugMode) {
      const accent = looks[palette.dark ? "dark" : "light"]?.accent ?? new Uint8Array();
      const enhanced = looks[palette.dark ? "dark" : "light"]?.tone;
      debugLayer = enhanced ? paintDebugLayer(debugMode, grid, enhanced, regions) : null;
      const names = ["none", "skin", "shirt", "hair", "outline"];
      const summary: Record<string, number> = {};
      regions.forEach((region, cell) => {
        if (figure[cell]) {
          const name = names[region];
          summary[name] = (summary[name] ?? 0) + 1;
          if (accent[cell]) {
            const key = `${accent[cell] === ACCENT_FULL ? "full" : "soft"} on ${name}`;
            summary[key] = (summary[key] ?? 0) + 1;
          }
        }
      });
      console.info("[MosaicPortrait]", {
        tiles: count,
        columns,
        rows,
        pitch,
        tile: tileSize,
        gap: pitch - tileSize,
        ...summary,
      });
      // For measuring the tiles from a test, without reading the canvas back.
      Object.assign(window, {
        __mosaicDebug: {
          grid,
          regions,
          hair: classified.hair,
          tiles: next,
          looks,
          colors,
          baseCount,
        },
      });
    }
  };

  const tileLeft = (tile: number) => (tiles ? tiles.targetX[tile] - gridX : 0);
  const tileTop = (tile: number) => (tiles ? tiles.targetY[tile] - gridY : 0);

  // How far in from its tile's corner a dot starts. Centred, unless it is bigger than the tile,
  // when it grows from the corner into the gap and stays on whole pixels.
  const insetOf = (size: number) => Math.max((tileSize - size) / 2, 0);

  // Empties a cell on the cache for a tile that is about to leave it, or to change.
  const clearHome = (tile: number) => {
    if (cacheContext && tiles) {
      const extent = Math.max(tileSize, Math.ceil(tileSize * tiles.shrink[tile]));
      cacheContext.globalAlpha = 1;
      cacheContext.fillStyle = palette.ground;
      cacheContext.fillRect(tileLeft(tile), tileTop(tile), extent, extent);
    }
  };

  const stampHome = (tile: number) => {
    if (cacheContext && tiles) {
      const color = tiles.colorIndex[tile];
      const size = tileSize * tiles.shrink[tile];
      const inset = insetOf(size);
      cacheContext.globalAlpha = tiles.fade[tile];
      cacheContext.fillStyle = styles[color];
      cacheContext.fillRect(tileLeft(tile) + inset, tileTop(tile) + inset, size, size);
    }
  };

  // Takes the whole cell off the cache, gap and all: the page's colour under the tiles is
  // what hides the name, so that has to go for it to show.
  const openHome = (tile: number) => {
    cacheContext?.clearRect(tileLeft(tile), tileTop(tile), pitch, pitch);
  };

  const closeHome = (tile: number) => {
    if (cacheContext) {
      cacheContext.globalAlpha = 1;
      cacheContext.fillStyle = palette.ground;
      cacheContext.fillRect(tileLeft(tile), tileTop(tile), pitch, pitch);
    }
  };

  const lift = (tile: number) => {
    if (tiles && !tiles.active[tile]) {
      tiles.active[tile] = 1;
      tiles.activeList[activeCount++] = tile;
      clearHome(tile);
    }
  };

  const paintGround = () => {
    if (!cacheContext) {
      return;
    }
    cacheContext.globalAlpha = 1;
    cacheContext.fillStyle = palette.ground;
    for (let index = 0; index < silhouette.length; index += 3) {
      cacheContext.fillRect(
        silhouette[index] - gridX,
        silhouette[index + 1] - gridY,
        silhouette[index + 2],
        pitch,
      );
    }
  };

  // In one go, so only for a new grid or a theme. Every other change is a tile stamped on
  // or lifted off.
  const paintCache = () => {
    if (!cacheContext || !tiles) {
      return;
    }

    const { order, fade, shrink, targetX, targetY, active, parted, activeList } = tiles;
    cacheContext.globalAlpha = 1;
    cacheContext.clearRect(0, 0, cache.width, cache.height);
    paintGround();
    cacheReady = true;

    let alpha = 1;
    let start = 0;
    colorEnds.forEach((end, color) => {
      cacheContext.fillStyle = styles[color];
      for (let cursor = start; cursor < end; cursor++) {
        const tile = order[cursor];
        if (active[tile]) {
          continue;
        }
        if (fade[tile] !== alpha) {
          cacheContext.globalAlpha = alpha = fade[tile];
        }
        const size = tileSize * shrink[tile];
        const inset = insetOf(size);
        cacheContext.fillRect(
          targetX[tile] - gridX + inset,
          targetY[tile] - gridY + inset,
          size,
          size,
        );
      }
      start = end;
    });

    // A theme change while the name is showing.
    for (let index = 0; index < activeCount; index++) {
      if (parted[activeList[index]]) {
        openHome(activeList[index]);
      }
    }
  };

  // Where the name's first line of glyphs sits against the canvas, without the CSS
  // entrance it may be partway through: the mask is for where it ends up.
  const nameLines = () =>
    Array.from(section.querySelectorAll<HTMLElement>('[data-intro-hide^="line-"]'));
  const entranceOffset = (line: HTMLElement) => {
    const { m41, m42 } = new DOMMatrixReadOnly(getComputedStyle(line).transform);
    return { x: m41, y: m42 };
  };
  const nameOffset = () => {
    const [line] = nameLines();
    if (!line) {
      return { x: 0, y: 0 };
    }
    const entrance = entranceOffset(line);
    const lineRect = line.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    return {
      x: lineRect.left - entrance.x - canvasRect.left,
      y: lineRect.top - entrance.y - canvasRect.top,
    };
  };

  // Rasterises the name at one pixel per grid cell, so reading a tile's coverage back is a
  // plain lookup. Letter by letter from the line's own rects, which already carry its
  // tracking and kerning, stroked one tile wide to dilate it.
  const maskName = () => {
    if (!tiles || !maskContext) {
      return;
    }

    maskContext.canvas.width = gridColumns;
    maskContext.canvas.height = gridRows;
    maskContext.setTransform(1 / pitch, 0, 0, 1 / pitch, -gridX / pitch, -gridY / pitch);
    maskContext.lineWidth = pitch * 2;
    maskContext.lineJoin = "round";

    const origin = canvas.getBoundingClientRect();
    const range = document.createRange();
    for (const line of nameLines()) {
      const text = line.firstChild;
      if (!(text instanceof Text)) {
        continue;
      }

      const lineStyles = getComputedStyle(line);
      const entrance = entranceOffset(line);
      const upper = lineStyles.textTransform === "uppercase";
      maskContext.font = `${lineStyles.fontWeight} ${parseFloat(lineStyles.fontSize) * dpr}px ${lineStyles.fontFamily}`;
      const ascent = maskContext.measureText("H").fontBoundingBoxAscent;
      for (let index = 0; index < text.length; index++) {
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        const glyph = range.getBoundingClientRect();
        const character = upper ? text.data[index].toUpperCase() : text.data[index];
        const x = (glyph.left - entrance.x - origin.left) * dpr;
        const y = (glyph.top - entrance.y - origin.top) * dpr + ascent;
        maskContext.fillText(character, x, y);
        maskContext.strokeText(character, x, y);
      }
    }

    const { data } = maskContext.getImageData(0, 0, gridColumns, gridRows);
    const { count, targetX, targetY, underName } = tiles;
    const cutoff = MOSAIC.textReveal.coverage * 255;
    let left = Infinity;
    let right = -Infinity;
    for (let tile = 0; tile < count; tile++) {
      const column = Math.round((targetX[tile] - gridX) / pitch);
      const row = Math.round((targetY[tile] - gridY) / pitch);
      const under = data[(row * gridColumns + column) * 4 + 3] > cutoff;
      underName[tile] = under ? 1 : 0;
      if (under) {
        left = Math.min(left, targetX[tile]);
        right = Math.max(right, targetX[tile]);
      }
    }
    nameSpan = { left, width: Math.max(right - left, 1) };
    maskedAt = nameOffset();
  };

  // Everything under the letters comes off the cache, to be drawn each frame as it parts.
  const partName = () => {
    if (!tiles) {
      return;
    }

    maskName();
    const { count, underName, parted } = tiles;
    for (let tile = 0; tile < count; tile++) {
      if (underName[tile] && !parted[tile]) {
        lift(tile);
        parted[tile] = 1;
        openHome(tile);
      }
    }
  };

  // The parallax moves the name and the portrait against each other under a resting pointer.
  const followName = () => {
    if (!overName) {
      return;
    }
    const { x, y } = nameOffset();
    if (Math.max(Math.abs(x - maskedAt.x), Math.abs(y - maskedAt.y)) * dpr >= pitch / 2) {
      partName();
      awake = true;
    }
  };

  // True when the grid was actually rebuilt. ResizeObserver also reports the size it
  // already has, and a rebuild reshuffles the tiles.
  const ensureGrid = () => {
    if (!image.complete || !image.naturalWidth || !context) {
      return false;
    }

    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;
    const boxRect = box.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, MOSAIC.maxDpr);
    const { minChange } = MOSAIC.rebuild;
    if (
      !boxWidth ||
      !boxHeight ||
      (built &&
        built.dpr === nextDpr &&
        Math.abs(built.box.width - boxRect.width) < minChange &&
        Math.abs(built.box.height - boxRect.height) < minChange &&
        Math.abs(built.section.width - sectionRect.width) < minChange &&
        Math.abs(built.section.height - sectionRect.height) < minChange)
    ) {
      return false;
    }

    const source = readPortrait(image, boxWidth, boxHeight);
    if (!source) {
      return false;
    }

    built = { box: boxRect, section: sectionRect, dpr: nextDpr };
    dpr = nextDpr;
    lively = isLively();
    const { count, fullFrom, minShare } = MOSAIC.dust;
    const heroArea = section.offsetWidth * section.offsetHeight;
    dustCount = Math.round(count * Math.min(Math.max(heroArea / fullFrom, minShare), 1));
    const { originX, originY } = sizeCanvas();
    buildTiles(source, boxWidth, boxHeight, originX, originY);
    return true;
  };

  // Specks stay off the copy, where they read as dirt on the type rather than as dust.
  const measureCopy = () => {
    const origin = canvas.getBoundingClientRect();
    const range = document.createRange();
    copyBounds = Array.from(section.querySelectorAll("[data-intro-hide]"), (element) => {
      range.selectNodeContents(element);
      const bounds = range.getBoundingClientRect();
      return {
        left: (bounds.left - origin.left) * dpr - tileSize,
        top: (bounds.top - origin.top) * dpr - tileSize,
        right: (bounds.right - origin.left) * dpr,
        bottom: (bounds.bottom - origin.top) * dpr,
      };
    });
  };

  const drawDust = (now: number) => {
    if (!context) {
      return;
    }

    context.fillStyle = palette.dust;
    const { min, max } = dustConfig.opacity[palette.dark ? "dark" : "light"];
    const middle = (min + max) / 2;
    const swing = (max - min) / 2;
    for (let speck = 0; speck < dustCount; speck++) {
      const x = Math.round(dust.x[speck] * canvas.width);
      const y = Math.round(dust.y[speck] * canvas.height);
      if (copyBounds.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom)) {
        continue;
      }

      const opacity = lively
        ? middle + swing * Math.sin(dust.phase[speck] + dust.rate[speck] * now)
        : min + dust.shade[speck] * (max - min);
      context.globalAlpha = opacity * surroundOpacity;
      context.fillRect(x, y, tileSize, tileSize);
    }
  };

  // The page's own background, under the tiles. Invisible on its own, it keeps the dust and
  // the name from showing through the gaps. Part of the cache once the mosaic has settled.
  const drawSilhouette = () => {
    if (!context) {
      return;
    }

    context.fillStyle = palette.ground;
    context.globalAlpha = surroundOpacity;
    for (let index = 0; index < silhouette.length; index += 3) {
      context.fillRect(silhouette[index], silhouette[index + 1], silhouette[index + 2], pitch);
    }
  };

  // Tiles off the cache: moved by the pointer, parted for the name, or both. Whole pixels,
  // so a moving tile stays as sharp as the rest and steps rather than blurs.
  const drawActive = () => {
    if (!context || !tiles || activeCount === 0) {
      return;
    }

    const { x, y, fade, shrink, reveal, parted, targetX, targetY, colorIndex, activeList } = tiles;
    const { opacity, scale } = MOSAIC.textReveal;

    // What the cache's holes used to hold, going as the tile goes, so the name fades in.
    context.fillStyle = palette.ground;
    for (let index = 0; index < activeCount; index++) {
      const tile = activeList[index];
      if (parted[tile]) {
        context.globalAlpha = 1 - easeReveal(reveal[tile]);
        context.fillRect(targetX[tile], targetY[tile], pitch, pitch);
      }
    }

    let style = "";
    let alpha = -1;

    for (let index = 0; index < activeCount; index++) {
      const tile = activeList[index];
      const color = colorIndex[tile];
      const parting = easeReveal(reveal[tile]);
      if (styles[color] !== style) {
        context.fillStyle = style = styles[color];
      }
      const nextAlpha = fade[tile] * (1 - (1 - opacity) * parting);
      if (nextAlpha !== alpha) {
        context.globalAlpha = alpha = nextAlpha;
      }

      const fullSize = tileSize * shrink[tile];
      const size = fullSize * (1 - (1 - scale) * parting);
      const inset = insetOf(size);
      context.fillRect(Math.round(x[tile]) + inset, Math.round(y[tile]) + inset, size, size);
    }
  };

  // A few accent tiles breathing, painted straight over their cached selves. Tiles the
  // cache holds at part opacity sit this out, since a second coat would show.
  const drawTwinkles = (now: number) => {
    if (!context || !tiles || accentTiles.length === 0) {
      return;
    }

    const { targetX, targetY, colorIndex, active, fade } = tiles;
    const { duration, strength } = MOSAIC.idle.twinkle;
    context.globalAlpha = 1;
    for (const twinkle of twinkles) {
      const age = (now - twinkle.start) / twinkle.duration;
      if (twinkle.start < 0 || age >= 1) {
        twinkle.tile = accentTiles[Math.floor(Math.random() * accentTiles.length)];
        twinkle.duration = between(duration);
        // Spread out, or the first batch would pulse in step and never drift apart.
        twinkle.start = now + Math.random() * twinkle.duration;
      } else if (age > 0 && !active[twinkle.tile] && fade[twinkle.tile] === 1) {
        const { tile } = twinkle;
        const color = colorIndex[tile];
        const size = tileSize * (palette.print ? tiles.shrink[tile] : 1);
        const inset = insetOf(size);
        const level = 1 + Math.sin(age * Math.PI * 2) * strength;
        const [red, green, blue] = colors[color];
        context.fillStyle = toCss([red * level, green * level, blue * level]);
        context.fillRect(targetX[tile] + inset, targetY[tile] + inset, size, size);
      }
    }
  };

  const draw = () => {
    if (!context || !tiles || phase === "waiting" || !onScreen) {
      return;
    }

    const now = performance.now() / 1000;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawDust(now);
    if (phase === "assembling") {
      drawSilhouette();
    } else {
      context.globalAlpha = 1;
      context.drawImage(cache, gridX, gridY);
      drawActive();
      if (lively) {
        drawTwinkles(now);
      }
      if (debugLayer) {
        context.globalAlpha = 1;
        context.drawImage(debugLayer, gridX, gridY);
      }
    }
    context.globalAlpha = 1;
  };

  // Lifts every tile under the pointer off the cache. A lookup by cell, so the cost is the
  // pointer's reach and not the size of the mosaic.
  const wakeNearPointer = () => {
    if (!tiles || !pointer) {
      return;
    }

    const { targetX, targetY, active } = tiles;
    const reach = MOSAIC.hover.radius * dpr;
    const half = tileSize / 2;
    const fromColumn = Math.max(Math.floor((pointer.x - reach - gridX) / pitch), 0);
    const toColumn = Math.min(Math.ceil((pointer.x + reach - gridX) / pitch), gridColumns - 1);
    const fromRow = Math.max(Math.floor((pointer.y - reach - gridY) / pitch), 0);
    const toRow = Math.min(Math.ceil((pointer.y + reach - gridY) / pitch), gridRows - 1);

    for (let row = fromRow; row <= toRow; row++) {
      for (let column = fromColumn; column <= toColumn; column++) {
        const tile = tileAt[row * gridColumns + column];
        if (tile < 0 || active[tile]) {
          continue;
        }
        const dx = targetX[tile] + half - pointer.x;
        const dy = targetY[tile] + half - pointer.y;
        if (dx * dx + dy * dy < reach * reach) {
          lift(tile);
        }
      }
    }
  };

  // Moves everything off the cache by one step. A tile near the pointer springs towards a spot
  // next to its own cell for part of each turn, and otherwise stays put. Moving them all at once
  // reads as a disc however small the move, and moving them away from the pointer as a ring
  // around a hole. A tile under the name parts or closes on its own clock, and instant jumps
  // straight to the end of that.
  const stepPhysics = (instant = false) => {
    if (!tiles) {
      return false;
    }
    if (pointerMoved) {
      wakeNearPointer();
      pointerMoved = false;
    }

    const { x, y, vx, vy, seed, targetX, targetY, active, activeList } = tiles;
    const { reveal, underName, parted } = tiles;
    const { radius, maxMove, busy, rate, spring, friction, settledBelow } = MOSAIC.hover;
    const { duration, stagger, outDuration } = MOSAIC.textReveal;
    const reach = radius * dpr;
    const move = maxMove * dpr;
    const settled = settledBelow * dpr;
    const half = tileSize / 2;
    const stepSeconds = PHYSICS_STEP_MS / 1000;
    const partBy = instant ? 1 : stepSeconds / duration;
    const closeBy = instant ? 1 : stepSeconds / outDuration;
    let moving = false;

    revealClock += stepSeconds;
    wanderClock += stepSeconds;
    for (let index = activeCount - 1; index >= 0; index--) {
      const tile = activeList[index];
      const wanted = overName && underName[tile] === 1;
      if (!wanted) {
        reveal[tile] = Math.max(reveal[tile] - closeBy, 0);
      } else if (
        instant ||
        revealClock >= ((targetX[tile] - nameSpan.left) / nameSpan.width) * stagger
      ) {
        reveal[tile] = Math.min(reveal[tile] + partBy, 1);
      }
      if (wanted ? reveal[tile] < 1 : reveal[tile] > 0) {
        moving = true;
      } else if (!wanted && parted[tile]) {
        parted[tile] = 0;
        closeHome(tile);
      }

      let goalX = 0;
      let goalY = 0;
      let hovered = false;

      if (pointer) {
        const near =
          1 -
          Math.hypot(targetX[tile] + half - pointer.x, targetY[tile] + half - pointer.y) / reach;
        if (near > 0) {
          hovered = true;
          // Above this line of a sine wave is the tile's turn. Further out the line is higher,
          // so turns are shorter and rarer, but a tile that moves still moves as far.
          const share = busy * near * near * (3 - 2 * near);
          const turn = Math.sin(wanderClock * rate + seed[tile] * 97) - (1 - share);
          if (turn > 0) {
            const amount = (move * turn) / share;
            goalX = amount * Math.cos(seed[tile] * 61);
            goalY = amount * Math.sin(seed[tile] * 61);
          }
        }
      }

      const offX = targetX[tile] + goalX - x[tile];
      const offY = targetY[tile] + goalY - y[tile];
      vx[tile] = (vx[tile] + offX * spring) * friction;
      vy[tile] = (vy[tile] + offY * spring) * friction;
      x[tile] += vx[tile];
      y[tile] += vy[tile];

      // Being slow isn't enough: every tile is, at the top of the spring's overshoot, and
      // the loop would go back to sleep with them all stuck out there.
      const slow = Math.abs(vx[tile]) + Math.abs(vy[tile]) < settled;
      const arrived = slow && Math.abs(offX) < 0.5 && Math.abs(offY) < 0.5;
      if (hovered || !arrived) {
        moving = true;
      } else if (!parted[tile]) {
        // Back on its cell: exact, and back on the cache.
        x[tile] = targetX[tile];
        y[tile] = targetY[tile];
        vx[tile] = vy[tile] = 0;
        active[tile] = 0;
        activeList[index] = activeList[--activeCount];
        stampHome(tile);
      }
    }

    return moving;
  };

  const applyNameHover = () => {
    if (overName) {
      revealClock = 0;
      partName();
    }
    if (lively) {
      awake = true;
    } else {
      // No frame loop to run it on: reduced motion, or a layout without the overlap.
      stepPhysics(true);
      draw();
    }
  };

  const driftDust = (seconds: number) => {
    const shareX = seconds / section.offsetWidth;
    const shareY = seconds / section.offsetHeight;
    for (let speck = 0; speck < dustCount; speck++) {
      dust.x[speck] = (dust.x[speck] + dust.vx[speck] * shareX + 1) % 1;
      dust.y[speck] = (dust.y[speck] + dust.vy[speck] * shareY + 1) % 1;
    }
  };

  const tick = (now: number) => {
    frame = window.requestAnimationFrame(tick);

    // Full rate only while tiles are physically moving.
    const elapsed = now - lastFrame;
    if (!awake && elapsed < IDLE_FRAME_MS) {
      return;
    }
    lastFrame = now;

    if (awake) {
      // Coming from idle, this frame's elapsed is the idle gap and not time anything moved
      // for. Counting it would run the first steps all at once, and bunch up the reveal.
      stepBudget += stepping
        ? Math.min(elapsed, PHYSICS_STEP_MS * MAX_STEPS_PER_FRAME)
        : PHYSICS_STEP_MS;
      let moving = true;
      while (stepBudget >= PHYSICS_STEP_MS) {
        moving = stepPhysics();
        stepBudget -= PHYSICS_STEP_MS;
      }
      awake = moving;
    }
    stepping = awake;

    if (lively) {
      driftDust(elapsed / 1000);
      followName();
    }
    draw();
  };

  const syncLoop = () => {
    const wanted = phase === "settled" && lively && onScreen && !document.hidden;
    if (wanted && !frame) {
      lastFrame = performance.now();
      frame = window.requestAnimationFrame(tick);
    } else if (!wanted && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const settle = () => {
    flight?.kill();
    flight = null;
    flightRenderer?.destroy();
    flightRenderer = null;
    flightCanvas.hidden = true;
    flightCanvas.width = flightCanvas.height = 0;
    phase = "settled";
    surroundOpacity = 1;
    measureCopy();
    awake = false;
    pointer = null;
    activeCount = 0;
    if (tiles) {
      tiles.x.set(tiles.targetX);
      tiles.y.set(tiles.targetY);
      tiles.vx.fill(0);
      tiles.vy.fill(0);
      tiles.reveal.fill(0);
      tiles.parted.fill(0);
      tiles.active.fill(0);
    }
    if (!cacheReady) {
      paintCache();
    }
    // The pointer may have been resting on the name since before the tiles landed.
    if (overName) {
      applyNameHover();
    }
    draw();
    syncLoop();
  };

  const prepareFlight = (nextTiming: Timing) => {
    timing = nextTiming;
    phase = "assembling";
    if (!tiles) {
      return 0;
    }

    const { startX, startY, startRotation, delay, reach, count } = tiles;
    const turn = lively ? (MOSAIC.assemble.rotation * Math.PI) / 180 : 0;
    for (let tile = 0; tile < count; tile++) {
      startX[tile] = Math.random() * canvas.width;
      startY[tile] = Math.random() * canvas.height;
      startRotation[tile] = (Math.random() * 2 - 1) * turn;
      delay[tile] = reach[tile] * timing.stagger + Math.random() * timing.scatter;
    }

    // The landing is ready before the first tile leaves, so the handoff has nothing to do
    // but show it. Drawing it once sends it to the GPU now, not on the frame it's needed.
    paintCache();
    if (context) {
      context.drawImage(cache, 0, 0, 1, 1);
      context.clearRect(0, 0, 1, 1);
    }

    flightCanvas.width = canvas.width;
    flightCanvas.height = canvas.height;
    flightCanvas.style.cssText = canvas.style.cssText;
    flightCanvas.hidden = false;
    flightRenderer = createFlightRenderer(
      flightCanvas,
      tiles,
      { tileSize, colorCount: colors.length },
      timing.flight,
    );
    flightRenderer?.setColors(colors, !palette.dark);
    // Nothing is in the air yet. This is for the driver, which finishes compiling a shader
    // on its first draw, and would otherwise do that on the flight's first frame.
    flightRenderer?.draw(0);
    return timing.flight + timing.stagger + timing.scatter;
  };

  const renderFlight = (time: number, duration: number) => {
    if (phase !== "assembling") {
      return;
    }

    surroundOpacity = Math.min(time / duration, 1);
    if (onScreen) {
      flightRenderer?.draw(time);
    }
    draw();
  };

  // A plain clock rather than a tween per tile, so none of this depends on the intro's
  // GSAP context surviving its revert. Without WebGL2 there is no flight: the finished
  // mosaic simply appears when it would have started, as it does under reduced motion.
  const createFlight = (nextTiming: Timing) => {
    const duration = prepareFlight(nextTiming);
    const clock = { time: 0 };
    flight = gsap.to(clock, {
      time: duration,
      duration,
      ease: "none",
      ...(flightRenderer
        ? { onUpdate: () => renderFlight(clock.time, duration), onComplete: settle }
        : { onStart: settle }),
    });
    return flight;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (phase !== "settled" || !lively) {
      return;
    }

    const { radius } = MOSAIC.hover;
    const rect = box.getBoundingClientRect();
    const near =
      event.clientX >= rect.left - radius &&
      event.clientX <= rect.right + radius &&
      event.clientY >= rect.top - radius &&
      event.clientY <= rect.bottom + radius;

    if (near) {
      const canvasRect = canvas.getBoundingClientRect();
      pointer = {
        x: (event.clientX - canvasRect.left) * dpr,
        y: (event.clientY - canvasRect.top) * dpr,
      };
      pointerMoved = true;
      awake = true;
    } else if (pointer) {
      pointer = null;
      awake = true;
    }
  };

  const handlePointerLeave = () => {
    pointer = null;
    awake = true;
  };

  const setOverName = (over: boolean) => {
    if (over !== overName) {
      overName = over;
      if (phase === "settled") {
        applyNameHover();
      }
    }
  };

  // The h1 is as wide as the copy's column, well past its last letter and across the figure,
  // so the box that counts stops where the letters do. Its height is the h1's own.
  const handleNameMove = (event: PointerEvent) => {
    const range = document.createRange();
    setOverName(
      nameLines().some((line) => {
        range.selectNodeContents(line);
        const { left, right } = range.getBoundingClientRect();
        return event.clientX >= left && event.clientX <= right;
      }),
    );
  };

  const handleNameLeave = () => setOverName(false);

  // On the section and the h1 rather than the canvas, which never takes a pointer event: the
  // buttons and the name under it have to stay clickable and selectable.
  if (hasHover) {
    name.addEventListener("pointermove", handleNameMove);
    name.addEventListener("pointerleave", handleNameLeave);
    if (!prefersReducedMotion()) {
      section.addEventListener("pointermove", handlePointerMove);
      section.addEventListener("pointerleave", handlePointerLeave);
    }
  }
  document.addEventListener("visibilitychange", syncLoop);
  // The copy's CSS entrance can outlast a short assembly, so where it ended up is only
  // known once that finishes.
  section.addEventListener("animationend", measureCopy);

  // What is left of the hero behind the header is off screen. Links to the next section stop
  // with that much of it there, and the loop would run on under whatever that one is doing.
  const visibility = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      draw();
      syncLoop();
    },
    { rootMargin: `-${HEADER_PX}px 0px 0px` },
  );
  visibility.observe(section);

  // Debounced, and only once there is a grid to rebuild: assemble and enter build the
  // first one themselves, after the fonts, so nothing is measured on fallback metrics.
  const resize = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (phase !== "waiting" && ensureGrid()) {
        settle();
      }
    }, MOSAIC.rebuild.debounceMs);
  });
  resize.observe(box);
  resize.observe(section);

  // Lenis writes to this attribute too, on every scroll lock, and a recolour isn't free.
  let dark = document.documentElement.classList.contains("dark");
  const themeChange = new MutationObserver(() => {
    const nextDark = document.documentElement.classList.contains("dark");
    if (nextDark === dark) {
      return;
    }
    dark = nextDark;
    palette = readPalette();
    dress();
    flightRenderer?.setColors(colors, !palette.dark);
    paintCache();
    draw();
  });
  themeChange.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  return {
    assemble() {
      if (phase !== "waiting") {
        return null;
      }
      ensureGrid();
      if (!tiles?.count) {
        return null;
      }
      return createFlight(lively ? MOSAIC.assemble.intro : MOSAIC.assemble.touch);
    },

    enter() {
      if (phase !== "waiting" || entering) {
        return;
      }
      entering = true;

      // The promise also keeps the tween out of any GSAP context the caller is in.
      // HeroIntro calls this from its own, and reverting that would kill the flight.
      void Promise.all([image.decode(), document.fonts.ready])
        .then(() => {
          if (destroyed || phase !== "waiting") {
            return;
          }
          ensureGrid();
          if (prefersReducedMotion()) {
            settle();
          } else if (tiles?.count) {
            createFlight(MOSAIC.assemble.quick);
          }
        })
        .catch(() => {
          // A broken image has nothing to sample, and its alt text is still there.
        });
    },

    retune(next) {
      tuning = next;
      built = null;
      if (phase === "settled" && ensureGrid()) {
        settle();
      }
    },

    destroy() {
      destroyed = true;
      flight?.kill();
      flightRenderer?.destroy();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
      name.removeEventListener("pointermove", handleNameMove);
      name.removeEventListener("pointerleave", handleNameLeave);
      document.removeEventListener("visibilitychange", syncLoop);
      section.removeEventListener("animationend", measureCopy);
      visibility.disconnect();
      resize.disconnect();
      themeChange.disconnect();
      canvas.width = 0;
      canvas.height = 0;
      cache.width = 0;
      cache.height = 0;
    },
  };
}

// The only picture of the portrait there is: the real image stays in the DOM at
// opacity 0, as the sampling source and for its alt text.
export function MosaicPortrait({
  ref,
  imageRef,
  boxRef,
  sectionRef,
  nameRef,
}: MosaicPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flightCanvasRef = useRef<HTMLCanvasElement>(null);
  const mosaicRef = useRef<Mosaic | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      assemble: () => mosaicRef.current?.assemble() ?? null,
      enter: () => mosaicRef.current?.enter(),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const flightCanvas = flightCanvasRef.current;
    const image = imageRef.current;
    const box = boxRef.current;
    const section = sectionRef.current;
    const name = nameRef.current;
    if (!canvas || !flightCanvas || !image || !box || !section || !name) {
      return;
    }

    const mosaic = createMosaic(canvas, flightCanvas, image, box, section, name);
    mosaicRef.current = mosaic;

    // While the head script's intro is playing, the intro decides when this starts.
    if (!window.__introFailsafe) {
      mosaic.enter();
    }

    let unmountPanel: (() => void) | null = null;
    let unmounted = false;
    if (
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("mosaicTune") === "1"
    ) {
      void import("@/components/sections/MosaicTunePanel").then(({ mountTunePanel }) => {
        if (!unmounted) {
          unmountPanel = mountTunePanel(
            { tone: MOSAIC.tone, accent: MOSAIC.accent },
            mosaic.retune,
          );
        }
      });
    }

    return () => {
      unmounted = true;
      unmountPanel?.();
      mosaic.destroy();
      mosaicRef.current = null;
    };
  }, [imageRef, boxRef, sectionRef, nameRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        width={0}
        height={0}
        className="absolute [image-rendering:pixelated]"
      />
      {/* Only for the second the tiles are in the air, then back to nothing. */}
      <canvas
        ref={flightCanvasRef}
        aria-hidden="true"
        hidden
        width={0}
        height={0}
        className="absolute [image-rendering:pixelated]"
      />
    </>
  );
}
