import type { ComponentPropsWithRef } from "react";
import { HudFrame } from "@/components/ui/hud-frame";

/** A square around one icon. Needs an aria-label. */
export function IconButton({
  className = "",
  children,
  ...props
}: ComponentPropsWithRef<"button">) {
  return (
    <HudFrame
      as="button"
      type="button"
      size="sm"
      interactive
      className={`hud-hollow inline-flex size-9 items-center justify-center text-foreground ${className}`.trim()}
      {...props}
    >
      <span aria-hidden="true" className="hud-reach" />
      {children}
    </HudFrame>
  );
}
