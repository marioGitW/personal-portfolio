import { getSocialLinks } from "@/lib/content";

export function SocialSidebar() {
  const socials = getSocialLinks();

  return (
    <aside
      aria-label="Social media links"
      className="fixed bottom-0 left-4 z-30 hidden flex-col items-center gap-6 pb-8 sm:left-6 md:flex lg:left-8"
    >
      <ul className="flex flex-col items-center gap-6">
        {socials.map(({ name, href, icon: Icon }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="group inline-flex text-slate-500 transition-all duration-[250ms] ease-out hover:text-[color:var(--color-accent-from)] focus-visible:text-[color:var(--color-accent-from)] motion-safe:hover:-translate-y-[3px] motion-safe:hover:scale-[1.08] dark:text-slate-400"
            >
              <Icon className="size-5 shrink-0 transition-[filter] duration-[250ms] ease-out group-hover:drop-shadow-[0_0_6px_var(--color-accent-from)]" />
            </a>
          </li>
        ))}
      </ul>
      <span aria-hidden="true" className="h-16 w-px bg-[var(--ghost-stroke)] lg:h-24" />
    </aside>
  );
}
