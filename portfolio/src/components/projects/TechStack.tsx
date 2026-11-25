import { HudTag } from "@/components/ui/hud-frame";

type TechStackProps = {
  technologies: string[];
  /** Truncate the list and show a "+N" tag for the rest. */
  limit?: number;
  className?: string;
};

export function TechStack({ technologies, limit, className = "" }: TechStackProps) {
  const visible = limit ? technologies.slice(0, limit) : technologies;
  const remaining = technologies.length - visible.length;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visible.map((tech, index) => (
        // Index-keyed: the CMS array is free text and may contain duplicates.
        <HudTag key={index} className="text-[11px] font-medium tracking-wide uppercase">
          {tech}
        </HudTag>
      ))}
      {remaining > 0 && <HudTag className="text-[11px] font-medium">+{remaining}</HudTag>}
    </div>
  );
}
