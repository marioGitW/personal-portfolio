// Shared by the inline <head> script in the root layout and by HeroIntro, so
// the two cannot disagree about whether the intro is playing.
const INTRO_STORAGE_KEY = "introPlayed";

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
