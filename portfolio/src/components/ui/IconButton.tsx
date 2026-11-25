import type { ComponentPropsWithRef } from "react";
import { HudFrame } from "@/components/ui/hud-frame";

/** 44px for a thumb, and 40 for a mouse. */
export const ICON_BUTTON_SIZE = "size-11 lg:pointer-fine:size-10";

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
      className={`hud-hollow inline-flex ${ICON_BUTTON_SIZE} items-center justify-center text-foreground ${className}`.trim()}
      {...props}
    >
      {children}
    </HudFrame>
  );
}
