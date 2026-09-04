import { Play } from "lucide-react";

type ProjectVideoProps = {
  demoVideoUrl: string;
  projectTitle: string | null;
  className?: string;
};

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

/**
 * Converts a share URL into its embeddable player URL.
 *
 * A plain `youtube.com/watch?v=…` link — the form you get from the browser
 * address bar and the most likely thing to be pasted into the CMS — sends
 * `X-Frame-Options: SAMEORIGIN` and renders as a blank box in an iframe. The
 * `/embed/` form is the one that actually plays.
 *
 * Returns null when the URL isn't a recognised provider, so the caller can
 * decide what to do with it.
 */
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
  const frameClasses =
    "relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-800";
  const title = projectTitle ? `${projectTitle} demo video` : "Demo video";

  if (isVideoFile(demoVideoUrl)) {
    return (
      <div className={`${frameClasses} ${className}`}>
        <video controls preload="metadata" className="h-full w-full" src={demoVideoUrl} />
      </div>
    );
  }

  const embedUrl = toEmbedUrl(demoVideoUrl) ?? (isHttpUrl(demoVideoUrl) ? demoVideoUrl : null);

  if (embedUrl) {
    return (
      <div className={`${frameClasses} ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allowFullScreen
        />
      </div>
    );
  }

  // Not a usable video source — show a polished "coming soon" placeholder
  // rather than a broken player.
  return (
    <div
      className={`project-visual-grid relative isolate flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-xl bg-accent-gradient opacity-10 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-accent-gradient shadow-lg shadow-indigo-500/30">
          <Play className="size-5 translate-x-0.5 fill-white text-white" />
        </span>
        <p className="text-xs font-medium tracking-[0.15em] text-slate-500 uppercase">
          Demo video coming soon
        </p>
      </div>
    </div>
  );
}
