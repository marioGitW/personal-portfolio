/**
 * Turns the About section's character render into what the hologram samples.
 *
 *   node scripts/build-character-cutout.mjs [path/to/character.png]
 *
 * Reads scripts/assets/character.png (a full figure on plain white) and writes
 * public/about/character-cutout.png, cropped to the figure:
 *
 *   R  luminance, 0-255
 *   G  255 where the pixel is the shirt's red graphic, else 0
 *   A  the figure's silhouette
 *
 * Run it again whenever the render changes.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] ?? join(root, "scripts", "assets", "character.png");
const target = join(root, "public", "about", "character-cutout.png");

// The hologram draws about 190 rows of dots at most, so this is plenty to average from.
const OUTPUT_HEIGHT = 840;
// Every channel at least this bright counts as the white page.
const WHITE = 248;
// White the page can't reach from the edge, such as the gap inside a bent arm, is still
// background once it is this many pixels. The whites of the eyes are far smaller.
const ENCLOSED_MIN = 900;
// The outermost pixels are blended with the white behind them.
const FRINGE = 3;
// Brows, eyes and the beard's edge are only a dot or two wide, and averaging a dot's worth of
// pixels washes them out, so local contrast goes up first. The radius is about one dot, as
// a share of the figure's height.
const CLARITY = { radius: 0.0065, amount: 1.1 };

const { data, info } = await sharp(source)
  .flatten({ background: "white" })
  .toColourspace("srgb")
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const count = width * height;

const white = new Uint8Array(count);
for (let pixel = 0; pixel < count; pixel++) {
  const at = pixel * channels;
  white[pixel] = Math.min(data[at], data[at + 1], data[at + 2]) >= WHITE ? 1 : 0;
}

// Background is every white region that touches the edge, or is too big to be a detail.
const background = new Uint8Array(count);
const seen = new Uint8Array(count);
const stack = new Int32Array(count);
for (let start = 0; start < count; start++) {
  if (!white[start] || seen[start]) {
    continue;
  }
  const region = [];
  let depth = 0;
  let touchesEdge = false;
  stack[depth++] = start;
  seen[start] = 1;
  while (depth > 0) {
    const pixel = stack[--depth];
    const x = pixel % width;
    const y = (pixel - x) / width;
    region.push(pixel);
    touchesEdge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
    const visit = (next, inside) => {
      if (inside && white[next] && !seen[next]) {
        seen[next] = 1;
        stack[depth++] = next;
      }
    };
    visit(pixel - 1, x > 0);
    visit(pixel + 1, x < width - 1);
    visit(pixel - width, y > 0);
    visit(pixel + width, y < height - 1);
  }
  if (touchesEdge || region.length >= ENCLOSED_MIN) {
    for (const pixel of region) {
      background[pixel] = 1;
    }
  }
}

// Grown inward past the pixels blended with white.
let outside = background;
for (let step = 0; step < FRINGE; step++) {
  const grown = Uint8Array.from(outside);
  for (let pixel = 0; pixel < count; pixel++) {
    const x = pixel % width;
    if (
      !outside[pixel] &&
      ((x > 0 && outside[pixel - 1]) ||
        (x < width - 1 && outside[pixel + 1]) ||
        (pixel >= width && outside[pixel - width]) ||
        (pixel < count - width && outside[pixel + width]))
    ) {
      grown[pixel] = 1;
    }
  }
  outside = grown;
}

// Only the largest piece is the figure. Anything else is noise on the page.
const label = new Int32Array(count);
let pieces = 0;
let figure = 0;
let figureSize = 0;
for (let start = 0; start < count; start++) {
  if (outside[start] || label[start]) {
    continue;
  }
  pieces += 1;
  let size = 0;
  let depth = 0;
  stack[depth++] = start;
  label[start] = pieces;
  while (depth > 0) {
    const pixel = stack[--depth];
    size += 1;
    const x = pixel % width;
    for (const [next, inside] of [
      [pixel - 1, x > 0],
      [pixel + 1, x < width - 1],
      [pixel - width, pixel >= width],
      [pixel + width, pixel < count - width],
    ]) {
      if (inside && !outside[next] && !label[next]) {
        label[next] = pieces;
        stack[depth++] = next;
      }
    }
  }
  if (size > figureSize) {
    figure = pieces;
    figureSize = size;
  }
}
if (!figure) {
  throw new Error(`Nothing but white in ${source}.`);
}

const luminance = new Float32Array(count);
const solid = new Float32Array(count);
const graphic = new Uint8Array(count);
let left = width;
let right = 0;
let top = height;
let bottom = 0;
let flagged = 0;
for (let pixel = 0; pixel < count; pixel++) {
  if (label[pixel] !== figure) {
    continue;
  }
  const at = pixel * channels;
  const [r, g, b] = [data[at], data[at + 1], data[at + 2]];
  // Skin passes the first two tests as easily as the print does (its red is well above its
  // green and blue too), so the print also has to be a red that is twice its green. The dark
  // line between the lips is that red as well, but nowhere near as bright.
  const isGraphic = r - b > 12 && r - g > 28 && r > 2 * g && r > 120;
  luminance[pixel] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  solid[pixel] = 1;
  graphic[pixel] = isGraphic ? 255 : 0;
  flagged += isGraphic ? 1 : 0;

  const x = pixel % width;
  const y = (pixel - x) / width;
  left = Math.min(left, x);
  right = Math.max(right, x);
  top = Math.min(top, y);
  bottom = Math.max(bottom, y);
}

// Two box passes each way, close enough to a Gaussian.
function blur(plane, radius) {
  let from = plane;
  for (const [step, lanes, length, laneStep] of [
    [1, height, width, width],
    [width, width, height, 1],
    [1, height, width, width],
    [width, width, height, 1],
  ]) {
    const to = new Float32Array(count);
    for (let lane = 0; lane < lanes; lane++) {
      const base = lane * laneStep;
      let sum = 0;
      for (let at = -radius; at < length; at++) {
        if (at + radius < length) {
          sum += from[base + (at + radius) * step];
        }
        if (at - radius - 1 >= 0) {
          sum -= from[base + (at - radius - 1) * step];
        }
        if (at >= 0) {
          to[base + at * step] = sum / (radius * 2 + 1);
        }
      }
    }
    from = to;
  }
  return from;
}

// Dividing by the blurred silhouette keeps the page out of it, or every edge would get a halo.
const radius = Math.max(Math.round((bottom - top + 1) * CLARITY.radius), 1);
const around = blur(luminance, radius);
const weight = blur(solid, radius);

const planes = Buffer.alloc(count * 4);
for (let pixel = 0; pixel < count; pixel++) {
  if (!solid[pixel]) {
    continue;
  }
  const detail = luminance[pixel] - around[pixel] / weight[pixel];
  const sharpened = luminance[pixel] + detail * CLARITY.amount;
  planes[pixel * 4] = Math.min(Math.max(Math.round(sharpened), 0), 255);
  planes[pixel * 4 + 1] = graphic[pixel];
  planes[pixel * 4 + 3] = 255;
}

await mkdir(dirname(target), { recursive: true });
const output = await sharp(planes, { raw: { width, height, channels: 4 } })
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ height: OUTPUT_HEIGHT, kernel: "lanczos3" })
  .png({ compressionLevel: 9 })
  .toFile(target);

console.log(
  `${target}\n  ${output.width}x${output.height}, ${Math.round(output.size / 1024)} KB, ` +
    `${((flagged / figureSize) * 100).toFixed(1)}% of the figure is graphic`,
);
