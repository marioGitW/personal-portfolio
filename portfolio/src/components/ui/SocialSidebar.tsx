import { SocialLinkList } from "@/components/ui/SocialLinkList";
import type { SocialLinkItem } from "@/types/sanity";

type SocialSidebarProps = {
  links: SocialLinkItem[];
};

export function SocialSidebar({ links }: SocialSidebarProps) {
  // Nothing authored in the CMS — render no sidebar at all rather than an
  // empty rail with a stray divider.
  if (links.length === 0) {
    return null;
  }

  return (
    <aside
      data-intro-chrome
      aria-label="Social media links"
      className="fixed bottom-0 left-4 z-30 hidden flex-col items-center gap-6 pb-8 sm:left-6 md:flex lg:left-8"
    >
      <SocialLinkList
        links={links}
        className="flex flex-col items-center gap-6"
        linkClassName="group inline-flex text-muted transition-all duration-[250ms] ease-out hover:text-link focus-visible:text-link motion-safe:hover:-translate-y-[3px] motion-safe:hover:scale-[1.08]"
        iconClassName="size-5 shrink-0"
      />
      <span aria-hidden="true" className="h-16 w-px bg-[var(--ghost-stroke)] lg:h-24" />
    </aside>
  );
}
