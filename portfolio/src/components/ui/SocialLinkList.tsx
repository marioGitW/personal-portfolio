import { SocialIcon, socialLabel } from "@/components/ui/SocialIcons";
import { isExternalHref, socialHref } from "@/lib/format";
import type { SocialLinkItem } from "@/types/sanity";

type SocialLinkListProps = {
  links: SocialLinkItem[];
  /** Classes for the <ul>. The sidebar stacks, the footer is a row. */
  className?: string;
  /** Classes for the <a>, which differ between the two call sites. */
  linkClassName: string;
  /** Classes for the icon, mainly its size. */
  iconClassName: string;
};

// Entries whose value doesn't resolve to an href are skipped, so a half-filled
// CMS row renders nothing rather than a dead icon.
export function SocialLinkList({
  links,
  className = "",
  linkClassName,
  iconClassName,
}: SocialLinkListProps) {
  return (
    <ul className={className}>
      {links.map((link) => {
        const href = socialHref(link);
        if (!href) {
          return null;
        }

        const label = socialLabel(link);
        const external = isExternalHref(href);

        return (
          <li key={link._key}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={label}
              title={label}
              className={linkClassName}
            >
              <SocialIcon link={link} className={iconClassName} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
