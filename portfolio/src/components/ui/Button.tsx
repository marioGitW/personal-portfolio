import type { ComponentPropsWithRef, ElementType } from "react";
import { HudFrame } from "@/components/ui/hud-frame";

type ButtonVariant = "primary" | "secondary";

type OwnProps<T extends ElementType> = {
  /** "a" or Link, for what navigates. */
  as?: T;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonProps<T extends ElementType> = OwnProps<T> &
  Omit<ComponentPropsWithRef<T>, keyof OwnProps<T> | "size">;

const variants: Record<ButtonVariant, string> = {
  primary: "hud-solid px-5 text-accent-foreground",
  // A pixel more at each side, for the outline the other one hasn't got.
  secondary: "hud-hollow px-5.25 text-foreground",
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps<T>) {
  const Tag: ElementType = as ?? "button";

  return (
    <HudFrame
      as={Tag}
      size="sm"
      interactive
      className={`inline-flex items-center justify-center py-2.75 text-sm font-medium ${variants[variant]} ${className}`.trim()}
      {...(Tag === "button" ? { type: "button" } : {})}
      {...props}
    />
  );
}
