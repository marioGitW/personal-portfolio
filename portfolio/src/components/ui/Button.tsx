import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", href, className = "", children, ...props },
  ref,
) {
  const classes = `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 ${variants[variant]} ${className}`;

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
