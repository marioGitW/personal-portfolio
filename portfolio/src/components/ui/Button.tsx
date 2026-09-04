import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-gradient text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-cyan-400/30",
  secondary:
    "border border-slate-300 bg-transparent text-foreground hover:border-indigo-500 dark:border-slate-700",
};

// Shared so ProjectLinks can style its own anchors, which need target/rel that
// this component's href branch does not carry.
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 ${variants[variant]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", href, className = "", children, ...props },
  ref,
) {
  const classes = buttonClasses(variant, className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} type="button" className={classes} {...props}>
      {children}
    </button>
  );
});
