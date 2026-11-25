import { Play } from "lucide-react";
import { HudFrame } from "@/components/ui/hud-frame";

type ProjectVideoProps = {
  demoVideoUrl: string;
  projectTitle: string | null;
  className?: string;
};

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

// A watch?v= link — the form most likely to be pasted into the CMS — sends
// X-Frame-Options and renders blank in an iframe; /embed/ is the one that
// plays. Null for an unrecognised provider, so the caller decides.
function toEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname.startsWith("/embed/")) {
      return url;
    }
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const id = parsed.pathname.split("/").filter(Boolean)[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  }

  if (host === "player.vimeo.com") {
    return url;
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function ProjectVideo({ demoVideoUrl, projectTitle, className = "" }: ProjectVideoProps) {
  // The padding keeps the player's square corners inside the chamfers.
  const frameClasses = "aspect-video w-full p-3";
  const title = projectTitle ? `${projectTitle} demo video` : "Demo video";

  if (isVideoFile(demoVideoUrl)) {
    return (
      <HudFrame size="md" className={`${frameClasses} ${className}`}>
        <video
          controls
          aria-label={title}
          preload="metadata"
          className="h-full w-full"
          src={demoVideoUrl}
        />
      </HudFrame>
    );
  }

  const embedUrl = toEmbedUrl(demoVideoUrl) ?? (isHttpUrl(demoVideoUrl) ? demoVideoUrl : null);

  if (embedUrl) {
    return (
      <HudFrame size="md" className={`${frameClasses} ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allowFullScreen
        />
      </HudFrame>
    );
  }

  // Not a usable source, so show a placeholder rather than a broken player.
  return (
    <HudFrame
      size="md"
      className={`flex aspect-video w-full items-center justify-center ${className}`}
    >
      <span aria-hidden="true" className="hud-media">
        <span className="project-visual-grid absolute inset-0" />
      </span>
      <div className="relative flex flex-col items-center gap-3">
        <HudFrame
          as="span"
          size="sm"
          className="grid size-14 place-items-center [--hud-fill:var(--background)]"
        >
          <Play className="size-5 translate-x-0.5 fill-muted text-muted" />
        </HudFrame>
        <p className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Demo video coming soon
        </p>
      </div>
    </HudFrame>
  );
}
