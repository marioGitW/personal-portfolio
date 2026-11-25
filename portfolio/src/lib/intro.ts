// Shared by the inline <head> script in the root layout and by HeroIntro, so
// the two cannot disagree about whether the intro is playing.
const INTRO_STORAGE_KEY = "introPlayed";

// The longest the page may wait for its intro to start: for the bundle, then the fonts and the
// portrait. Past it the hero is simply shown, so nothing that fails can strand a blank page.
export const INTRO_DEADLINE_MS = 3000;

declare global {
  interface Window {
    // The deadline's timer id. Set only by the head script, so it doubles as
    // "this hard load is playing the intro". A client-side navigation to the
    // homepage never sets it.
    __introFailsafe?: number;
    // When that is, on performance.now()'s clock. HeroIntro takes it over from the timer.
    __introDeadline?: number;
  }
}

// Runs while the HTML is parsed, before first paint. A deep link keeps the
// visitor where they were heading, and only the homepage has a hero to land on.
// If this never runs, the attribute is never set and the hero stays visible.
// Reduced motion has an intro too, which HeroIntro makes a plain fade.
export const introHeadScript = `(function(){try{var d=document.documentElement,h=location.hash;if(location.pathname==="/"&&(!h||h==="#home")&&!sessionStorage.getItem("${INTRO_STORAGE_KEY}")){d.setAttribute("data-intro","pending");window.__introDeadline=performance.now()+${INTRO_DEADLINE_MS};window.__introFailsafe=setTimeout(function(){window.__introFailsafe=0;d.setAttribute("data-intro","done")},${INTRO_DEADLINE_MS})}}catch(e){}})()`;

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
