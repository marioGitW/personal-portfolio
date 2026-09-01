import { getSocialLinks } from "@/lib/content";

export function Profiles() {
  const links = getSocialLinks();

  return (
    <section id="profiles" className="mx-auto w-full max-w-[1400px] px-4 py-28 sm:px-6">
      <p className="font-heading text-xs tracking-[0.2em] text-slate-500 uppercase">Profiles</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight">Find me online</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.platform}>
            <a
              href={link.url}
              data-cursor="Open"
              className="block rounded-2xl border border-slate-200 px-5 py-4 transition hover:border-indigo-500 hover:shadow-lg hover:shadow-cyan-400/20 dark:border-slate-800"
            >
              {link.platform}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
