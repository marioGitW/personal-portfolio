import { getSiteSettings, getSocialLinks } from "@/lib/content";
import { navItems } from "@/lib/nav";

export function Footer() {
  const site = getSiteSettings();
  const socials = getSocialLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 px-4 py-12 dark:border-slate-800">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{site.name}</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {site.tagline}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4 text-sm">
            {navItems.map((item) => (
              <li key={item.sectionId}>
                <a href={item.href} className="text-slate-500 hover:text-foreground dark:text-slate-400">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          {socials.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              className="text-slate-500 hover:text-foreground dark:text-slate-400"
            >
              {link.platform}
            </a>
          ))}
          <a href={`mailto:${site.email}`} className="text-accent-gradient">
            {site.email}
          </a>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1400px] text-xs text-slate-500">
        © {year} {site.name}
      </p>
    </footer>
  );
}
