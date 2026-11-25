"use client";

import { useEffect, useRef, type RefObject } from "react";
import { hologramLayout } from "@/components/about/hologram";

type HudConnectorProps = {
  /** What it is positioned in. */
  rowRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
};

// From the portal's edge to the small square that starts the line.
const PORTAL_GAP = 5;

// The line from the portal to the panel. Both ends come from the elements' own boxes, so it
// follows whatever the layout does. Desktop only, in CSS.
export function HudConnector({ rowRef, stageRef, panelRef }: HudConnectorProps) {
  const connectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const connector = connectorRef.current;
    if (!row || !stage || !panel || !connector) {
      return;
    }

    const place = () => {
      const rowBox = row.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      const { portal } = hologramLayout(stageBox.width, stageBox.height);

      // On whole pixels of the page, or the squares come out soft at 1x.
      const startX = Math.round(stageBox.left + portal.cx + portal.rx + PORTAL_GAP);
      const startY = Math.round(stageBox.top + window.scrollY + portal.cy) - window.scrollY;
      const left = startX - rowBox.left;
      const y = startY - rowBox.top;
      const width = Math.max(panelBox.left - startX, 0);
      connector.style.width = `${width}px`;
      connector.style.transform = `translate(${left}px, ${y}px)`;
      connector.style.setProperty("--hud-track", `${width}px`);
    };

    const observer = new ResizeObserver(place);
    for (const element of [row, stage, panel]) {
      observer.observe(element);
    }
    place();

    return () => observer.disconnect();
  }, [rowRef, stageRef, panelRef]);

  return (
    <div
      ref={connectorRef}
      aria-hidden="true"
      data-hud-connector
      className="hud-connector pointer-events-none absolute top-0 left-0 z-20 hidden lg:block"
    >
      <span className="hud-connector-start" />
      <span className="hud-connector-track">
        <svg className="hud-connector-dashes">
          <line x1={0} y1={0.5} x2="100%" y2={0.5} />
        </svg>
        <span className="hud-connector-line" />
        <span className="hud-connector-pulse" />
      </span>
      <span className="hud-connector-notch" />
      <span className="hud-connector-node" />
    </div>
  );
}
