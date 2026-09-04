type PaginationDotsProps = {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  /**
   * Skills presents its dots as a tablist; the screenshot carousel uses
   * aria-current instead. Both shapes are kept rather than merged into one.
   */
  variant: "tab" | "current";
  label?: string;
  itemLabel: (index: number) => string;
  className?: string;
  buttonClassName?: string;
  /** Skills adds a group-hover tint here; the carousel does not. */
  inactiveClassName?: string;
};

export function PaginationDots({
  count,
  active,
  onSelect,
  variant,
  label,
  itemLabel,
  className = "",
  buttonClassName = "",
  inactiveClassName = "w-1.5 bg-slate-300 dark:bg-slate-700",
}: PaginationDotsProps) {
  const isTab = variant === "tab";

  return (
    <div className={className} {...(isTab ? { role: "tablist", "aria-label": label } : {})}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={itemLabel(i)}
          {...(isTab
            ? { role: "tab", "aria-selected": i === active }
            : { "aria-current": i === active })}
          className={`grid cursor-pointer place-items-center p-2.5 ${buttonClassName}`}
        >
          <span
            aria-hidden="true"
            className={`pagination-dot ${
              i === active ? "w-6 bg-accent-gradient" : inactiveClassName
            }`}
          />
        </button>
      ))}
    </div>
  );
}
