"use client";

import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import { createHologram, type Hologram } from "@/components/about/hologram";

export type HologramHandle = Omit<Hologram, "destroy">;

type HologramCharacterProps = {
  ref?: Ref<HologramHandle>;
  stageRef: RefObject<HTMLDivElement | null>;
  /** Must be stable: a new one rebuilds the hologram. */
  onActiveChange: (active: boolean) => void;
};

// The figure is never in the page as an image: the canvas is all there is of it. The stage
// has its full size before anything is drawn, so nothing moves when it is.
export function HologramCharacter({ ref, stageRef, onActiveChange }: HologramCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hologramRef = useRef<Hologram | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) {
      return;
    }

    const hologram = createHologram({ stage, canvas, onActiveChange });
    hologramRef.current = hologram;

    return () => {
      hologramRef.current = null;
      hologram?.destroy();
    };
  }, [stageRef, onActiveChange]);

  useImperativeHandle(
    ref,
    () => ({
      enter: () => hologramRef.current?.enter(),
      leave: () => hologramRef.current?.leave(),
      scan: () => hologramRef.current?.scan(),
      ready: () => hologramRef.current?.ready() ?? Promise.resolve(),
      reveal: (timeline) => hologramRef.current?.reveal(timeline),
      setPhase: (phase) => hologramRef.current?.setPhase(phase),
      appear: () => hologramRef.current?.appear(),
    }),
    [],
  );

  return (
    <div ref={stageRef} data-about-stage className="about-stage">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Halftone hologram illustration of Mario"
        className="pointer-events-none absolute"
      />
    </div>
  );
}
