import type { MosaicTuning } from "@/components/sections/MosaicPortrait";

// Development only, behind ?mosaicTune=1: sliders over the mosaic's tone and accent config that
// rebuild it as they move, and a button that copies the values to paste back over the config.
// MosaicPortrait only imports this inside a NODE_ENV check, so it never ships.

type Slider = { path: string; label: string; min: number; max: number; step: number };

const SLIDERS: Slider[] = [
  { path: "tone.contrast", label: "Contrast", min: 1, max: 2, step: 0.01 },
  { path: "tone.balance", label: "Balance (stretch limit)", min: 1, max: 12, step: 0.1 },
  { path: "tone.clarity", label: "Clarity", min: 0, max: 1, step: 0.01 },
  { path: "tone.claheBlend", label: "CLAHE blend", min: 0, max: 0.3, step: 0.01 },
  { path: "tone.keyLight.falloff", label: "Key-light falloff", min: 0, max: 0.4, step: 0.01 },
  { path: "tone.faceDepth", label: "Face depth", min: 0, max: 1.5, step: 0.05 },
  { path: "tone.hairBurn", label: "Hair burn", min: 0, max: 0.8, step: 0.01 },
  { path: "tone.edgeBurn", label: "Edge burn", min: 0, max: 0.2, step: 0.005 },
  { path: "tone.sharpen", label: "Sharpen", min: 0, max: 2, step: 0.05 },
  { path: "tone.light.clarity", label: "Light: clarity", min: 0, max: 1.5, step: 0.01 },
  { path: "tone.light.sharpen", label: "Light: sharpen", min: 0, max: 2.5, step: 0.05 },
  { path: "tone.light.faceDepth", label: "Light: face depth", min: 0, max: 1, step: 0.05 },
  { path: "tone.light.printContrast", label: "Light: contrast", min: 1, max: 2, step: 0.01 },
  {
    path: "tone.light.openFrom",
    label: "Light: highlights open from",
    min: 0.7,
    max: 1,
    step: 0.005,
  },
  { path: "tone.light.midtoneDot", label: "Light: least face dot", min: 0, max: 0.5, step: 0.01 },
  { path: "tone.light.shirtDot", label: "Light: least shirt dot", min: 0, max: 1, step: 0.01 },
  { path: "tone.light.contour", label: "Light: contour", min: 0, max: 0.8, step: 0.01 },
  { path: "tone.light.maxDot", label: "Light: biggest dot", min: 0.7, max: 1, step: 0.005 },
  { path: "tone.light.fadeFrom", label: "Light: bottom fade from", min: 0.8, max: 1, step: 0.005 },
  { path: "accent.shirtHighlightPercent", label: "Accent: shirt %", min: 0, max: 25, step: 0.5 },
  { path: "accent.fullPercent", label: "Accent: full %", min: 0, max: 10, step: 0.1 },
  { path: "accent.maxMix", label: "Accent: max mix", min: 0, max: 1, step: 0.01 },
];

type Branch = Record<string, unknown>;

function read(values: Branch, path: string) {
  return path
    .split(".")
    .reduce<unknown>((branch, key) => (branch as Branch)[key], values) as number;
}

function write(values: Branch, path: string, value: number) {
  const keys = path.split(".");
  const last = keys.pop() as string;
  const branch = keys.reduce<Branch>((parent, key) => parent[key] as Branch, values);
  branch[last] = value;
}

function decimals(step: number) {
  return Math.max(0, -Math.floor(Math.log10(step)));
}

export function mountTunePanel(initial: MosaicTuning, onChange: (tuning: MosaicTuning) => void) {
  const values = JSON.parse(JSON.stringify(initial)) as Branch;
  let frame = 0;

  const panel = document.createElement("aside");
  panel.setAttribute("aria-label", "Mosaic tuning");
  // Lenis would otherwise take the wheel over the panel's own scroll.
  panel.setAttribute("data-lenis-prevent", "");
  panel.style.cssText = [
    "position:fixed",
    "top:80px",
    "right:16px",
    "z-index:1000",
    "width:272px",
    "max-height:calc(100vh - 96px)",
    "overflow:auto",
    "padding:12px",
    "border:1px solid var(--border)",
    "border-radius:8px",
    "background:var(--surface)",
    "color:var(--foreground)",
    "font:12px/1.4 var(--font-mono, monospace)",
    "box-shadow:0 8px 24px rgb(0 0 0 / 0.2)",
  ].join(";");

  const title = document.createElement("strong");
  title.textContent = "Mosaic tuning";
  title.style.cssText = "display:block;margin-bottom:8px";
  panel.append(title);

  for (const slider of SLIDERS) {
    const label = document.createElement("label");
    label.style.cssText = "display:block;margin-bottom:6px";
    const caption = document.createElement("span");
    caption.style.cssText = "display:flex;justify-content:space-between";
    const name = document.createElement("span");
    name.textContent = slider.label;
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.dataset.path = slider.path;
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(read(values, slider.path));
    input.style.cssText = "display:block;width:100%;accent-color:var(--accent)";
    const show = () => {
      output.textContent = Number(input.value).toFixed(decimals(slider.step));
    };
    show();
    input.addEventListener("input", () => {
      write(values, slider.path, Number(input.value));
      show();
      // One rebuild a frame however fast the slider moves.
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => onChange(structuredClone(values) as MosaicTuning));
    });
    caption.append(name, output);
    label.append(caption, input);
    panel.append(label);
  }

  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy config";
  copy.style.cssText = [
    "margin-top:6px",
    "width:100%",
    "padding:6px",
    "border-radius:6px",
    "border:1px solid var(--border)",
    "background:var(--accent)",
    "color:var(--accent-foreground)",
    "font:inherit",
    "cursor:pointer",
  ].join(";");
  copy.addEventListener("click", () => {
    const text = JSON.stringify(values, null, 2);
    const done = (message: string) => {
      copy.textContent = message;
      window.setTimeout(() => (copy.textContent = "Copy config"), 1500);
    };
    navigator.clipboard.writeText(text).then(
      () => done("Copied"),
      () => {
        // No clipboard permission: leave it in the console to copy from there.
        console.info("[MosaicPortrait] tuning", text);
        done("Logged to console");
      },
    );
  });
  panel.append(copy);

  document.body.append(panel);
  return () => {
    window.cancelAnimationFrame(frame);
    panel.remove();
  };
}
