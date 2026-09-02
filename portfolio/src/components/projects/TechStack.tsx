type TechStackProps = {
  technologies: string[];
  /** Truncate the list and show a "+N" pill for the rest. */
  limit?: number;
  className?: string;
};

export function TechStack({ technologies, limit, className = "" }: TechStackProps) {
  const visible = limit ? technologies.slice(0, limit) : technologies;
  const remaining = technologies.length - visible.length;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visible.map((tech) => (
        <span
          key={tech}
          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide text-cyan-600 uppercase dark:text-cyan-300"
        >
          {tech}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[0.7rem] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
          +{remaining}
        </span>
      )}
    </div>
  );
}
