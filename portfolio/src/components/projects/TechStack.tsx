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
      {visible.map((tech, index) => (
        // Index-keyed: the CMS array is free text and may contain duplicates.
        <span key={index} className="pill-tech">
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
