import { getProjects } from "@/lib/content";

export function Projects() {
  const projects = getProjects();

  return (
    <section id="projects" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">Projects</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight">Selected work</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.title}
            data-cursor="View"
            className="rounded-2xl border border-slate-200 p-6 transition hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 dark:border-slate-800"
          >
            <p className="font-body text-xs text-slate-500">
              {project.date} · {project.category}
            </p>
            <h3 className="mt-2 text-xl font-semibold">{project.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {project.description}
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <a href={project.liveUrl} className="text-accent-gradient">
                View Live
              </a>
              <a href={project.githubUrl} className="text-slate-500 hover:text-foreground">
                GitHub
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
