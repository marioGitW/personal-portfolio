import { HudTag } from "@/components/ui/hud-frame";

type TechStackProps = {
  technologies: string[];
  className?: string;
};

export function TechStack({ technologies, className = "" }: TechStackProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {technologies.map((tech, index) => (
        // Index-keyed: the CMS array is free text and may contain duplicates.
        <HudTag key={index} className="text-[11px] font-medium tracking-wide uppercase">
          {tech}
        </HudTag>
      ))}
    </div>
  );
}
