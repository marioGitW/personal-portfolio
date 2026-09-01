import { getSiteSettings } from "@/lib/content";

export function About() {
  const site = getSiteSettings();

  return (
    <section id="about" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">About</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight">
        A bit about <span className="text-accent-gradient">me</span>
      </h2>
      <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">{site.bio}</p>
    </section>
  );
}
