import { Play } from "lucide-react";

type ProjectVideoProps = {
  demoVideoUrl: string;
  projectTitle: string;
  className?: string;
};

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function isEmbeddableUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function ProjectVideo({ demoVideoUrl, projectTitle, className = "" }: ProjectVideoProps) {
  const frameClasses =
    "relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-800";

  if (isVideoFile(demoVideoUrl)) {
    return (
      <div className={`${frameClasses} ${className}`}>
        <video controls preload="metadata" className="h-full w-full" src={demoVideoUrl} />
      </div>
    );
  }

  if (isEmbeddableUrl(demoVideoUrl)) {
    return (
      <div className={`${frameClasses} ${className}`}>
        <iframe
          src={demoVideoUrl}
          title={`${projectTitle} demo video`}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Not a real video source (e.g. the "placeholder" sentinel) — show a
  // polished "coming soon" placeholder rather than a broken player.
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
