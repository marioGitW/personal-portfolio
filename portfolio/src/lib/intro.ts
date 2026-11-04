// Shared by the inline <head> script in the root layout and by HeroIntro, so
// the two cannot disagree about whether the intro is playing.
export const INTRO_STORAGE_KEY = "introPlayed";

// How long the script waits for the page to hydrate before giving up on the
// intro and showing the hero, so a failed bundle cannot strand a blank page.
const HYDRATION_FAILSAFE_MS = 6000;

declare global {
  interface Window {
    // The failsafe's timer id. Set only by the head script, so it doubles as
    // "this hard load is playing the intro". A client-side navigation to the
    // homepage never sets it.
    __introFailsafe?: number;
  }
}

// Runs while the HTML is parsed, before first paint. A deep link keeps the
// visitor where they were heading, and only the homepage has a hero to land on.
// If this never runs, the attribute is never set and the hero stays visible.
export const introHeadScript = `(function(){try{var d=document.documentElement,h=location.hash;if(location.pathname==="/"&&(!h||h==="#home")&&!sessionStorage.getItem("${INTRO_STORAGE_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-intro","pending");window.__introFailsafe=setTimeout(function(){window.__introFailsafe=0;d.setAttribute("data-intro","done")},${HYDRATION_FAILSAFE_MS})}}catch(e){}})()`;

export function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // Storage blocked: the head script could not read it either, so no replay.
  }
}
