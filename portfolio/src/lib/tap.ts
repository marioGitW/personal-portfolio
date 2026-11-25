// A finger going down and up again on the spot. Anything that moves further or takes longer is
// a scroll, or a change of mind.
const TAP = { maxMove: 10, maxMs: 300 };

const OPTIONS = { capture: true, passive: true };

/**
 * Taps on `target` and what is in it, from a finger or a pen but never a mouse. `accept` has its
 * say as the finger goes down. It only listens, so it can't hold up a scroll.
 */
export function listenForTaps(
  target: Window | HTMLElement,
  onTap: (event: PointerEvent) => void,
  accept: (event: PointerEvent) => boolean = () => true,
): () => void {
  // The pointer that is down, or -1.
  const down = { id: -1, x: 0, y: 0, at: 0 };

  const handleDown = (event: Event) => {
    const pointer = event as PointerEvent;
    if (pointer.pointerType === "mouse") {
      return;
    }
    // A second finger makes it a pinch, whatever the first one does next.
    const taps = pointer.isPrimary && accept(pointer);
    down.id = taps ? pointer.pointerId : -1;
    down.x = pointer.clientX;
    down.y = pointer.clientY;
    down.at = pointer.timeStamp;
  };

  const handleUp = (event: Event) => {
    const pointer = event as PointerEvent;
    if (pointer.pointerId !== down.id) {
      return;
    }
    down.id = -1;
    const moved = Math.hypot(pointer.clientX - down.x, pointer.clientY - down.y);
    if (moved < TAP.maxMove && pointer.timeStamp - down.at < TAP.maxMs) {
      onTap(pointer);
    }
  };

  // What the browser sends instead of an up, once it has taken the finger for a scroll.
  const handleCancel = () => {
    down.id = -1;
  };

  target.addEventListener("pointerdown", handleDown, OPTIONS);
  target.addEventListener("pointerup", handleUp, OPTIONS);
  target.addEventListener("pointercancel", handleCancel, OPTIONS);

  return () => {
    target.removeEventListener("pointerdown", handleDown, OPTIONS);
    target.removeEventListener("pointerup", handleUp, OPTIONS);
    target.removeEventListener("pointercancel", handleCancel, OPTIONS);
  };
}
