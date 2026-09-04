import { ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { GitHubIcon } from "@/components/ui/SocialIcons";
import { isExternalHref } from "@/lib/format";
import type { Project } from "@/types/sanity";

function safeUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed && isExternalHref(trimmed) ? trimmed : null;
}

type ProjectLinksProps = {
  project: Pick<Project, "liveProjectUrl" | "sourceCodeUrl">;
  className?: string;
};

// Each button renders only when its URL exists — no disabled placeholders.
export function ProjectLinks({ project, className = "" }: ProjectLinksProps) {
  // Only http(s) URLs are rendered, so a malformed CMS value can't become a
  // link with some other scheme.
  const liveUrl = safeUrl(project.liveProjectUrl);
  const sourceUrl = safeUrl(project.sourceCodeUrl);

  if (!liveUrl && !sourceUrl) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("primary", "gap-2")}
        >
          <ExternalLink className="size-4" />
          Live Project
        </a>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "gap-2")}
        >
          <GitHubIcon className="size-4" />
          Source Code
        </a>
      )}
    </div>
  );
}
