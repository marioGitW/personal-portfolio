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
      // In the gutter beside the content, however narrow that is, so it never covers any. On
      // touch and on smaller screens the menu and the footer have the same links.
      className="fixed bottom-0 left-[min(2rem,calc(var(--page-gutter)/2-0.625rem))] z-30 hidden flex-col items-center gap-6 pb-8 xl:pointer-fine:flex"
    >
      <SocialLinkList
        links={links}
        className="flex flex-col items-center gap-6"
        linkClassName="inline-flex text-muted transition-all duration-[250ms] ease-out hover:text-link focus-visible:text-link focus-visible:outline-offset-0 motion-safe:hover:-translate-y-[3px] motion-safe:hover:scale-[1.08]"
        iconClassName="size-5 shrink-0"
      />
      <span aria-hidden="true" className="h-16 w-px bg-border lg:h-24" />
    </aside>
  );
}
