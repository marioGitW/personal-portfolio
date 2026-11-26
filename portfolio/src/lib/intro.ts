// Shared by the inline <head> script in the root layout and by HeroIntro, so
// the two cannot disagree about whether the intro is playing.
const INTRO_STORAGE_KEY = "introPlayed";

// How long the page may take to get its script running, from when it is parsed, before the hero
// is shown without the intro. A phone on a first visit needs a few seconds of it, and a bundle
// that never arrives must not strand a blank page.
export const INTRO_SCRIPT_MS = 6000;

// Once the script runs: how long the intro may take to start (the fonts, the portrait and its
// mosaic), and how long it may stand still once it has, before the hero is shown regardless.
export const INTRO_START_MS = 3000;

// ?introDebug on the homepage plays the intro on every load and writes what it did on the page,
// for a phone with no inspector to hand.
const INTRO_DEBUG = "introDebug";

declare global {
  interface Window {
    // The head script's timer id. Set only by the head script, so it doubles as
    // "this hard load is playing the intro". A client-side navigation to the
    // homepage never sets it.
    __introFailsafe?: number;
    // When the head script ran, on performance.now()'s clock.
    __introStart?: number;
    // ?introDebug only: each step and when it happened.
    __introLog?: [step: string, at: number][];
  }
}

// Runs while the HTML is parsed, before first paint. A deep link keeps the
// visitor where they were heading, and only the homepage has a hero to land on.
// If this never runs, the attribute is never set and the hero stays visible.
// Reduced motion has an intro too, which HeroIntro makes a plain fade.
export const introHeadScript = `(function(){try{var d=document.documentElement,h=location.hash,q=new RegExp("[?&]${INTRO_DEBUG}(=|&|$)").test(location.search);if(location.pathname==="/"&&(!h||h==="#home")&&(q||!sessionStorage.getItem("${INTRO_STORAGE_KEY}"))){d.setAttribute("data-intro","pending");var t=performance.now();window.__introStart=t;if(q)window.__introLog=[["page parsed",t]];window.__introFailsafe=setTimeout(function(){window.__introFailsafe=0;if(window.__introLog)window.__introLog.push(["no script after ${INTRO_SCRIPT_MS}ms: hero shown",performance.now()]);d.setAttribute("data-intro","done")},${INTRO_SCRIPT_MS})}}catch(e){}})()`;

// The look of the hero name, shared by its two lines and the intro word that lands on
// them. The tracking is the h1's old -0.055em stated outright: that em resolved against
// the h1's own size, not the much larger one these lines render at.
export const HERO_NAME_CLASSES =
  "font-heading text-[clamp(3.5rem,15vw,13rem)] leading-[0.86] font-bold tracking-[calc(clamp(2.75rem,2rem_+_3vw,4.5rem)*-0.055)] whitespace-nowrap uppercase lg:text-[clamp(3.5rem,12.5vw,13rem)]";

export function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // Storage blocked: the head script could not read it either, so no replay.
  }
}

/** A step of the intro, for ?introDebug. Nothing at all without it. */
export function noteIntro(step: string): void {
  window.__introLog?.push([step, performance.now()]);
}

type NetworkInformation = { effectiveType?: string; downlink?: number; rtt?: number };

/** ?introDebug: the steps so far, and the device, in a panel over the page. A tap closes it. */
export function showIntroLog(): void {
  const log = window.__introLog;
  if (!log || document.getElementById("intro-log")) {
    return;
  }

  const [, start] = log[0];
  const network = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const lines = [
    ...log.map(([step, at]) => `+${String(Math.round(at - start)).padStart(5)}ms  ${step}`),
    "",
    `${window.innerWidth}x${window.innerHeight} at ${window.devicePixelRatio}x, ${navigator.hardwareConcurrency ?? "?"} cores`,
    network
      ? `network ${network.effectiveType ?? "?"}, ${network.downlink ?? "?"}Mbps, ${network.rtt ?? "?"}ms`
      : "network unknown",
    navigator.userAgent,
    "",
    "Tap to close",
  ];

  const panel = document.createElement("pre");
  panel.id = "intro-log";
  panel.textContent = lines.join("\n");
  panel.style.cssText =
    "position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;margin:0;padding:12px;max-height:70vh;overflow:auto;font:12px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;color:#fff;background:rgba(0,0,0,.88);border-radius:6px";
  panel.addEventListener("click", () => panel.remove());
  document.body.append(panel);
}
