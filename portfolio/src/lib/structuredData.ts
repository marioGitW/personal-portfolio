import { siteSettings } from "@/content/fallbacks";
import { projectPath, socialHref } from "@/lib/format";
import { projectDescription, projectTitle } from "@/lib/seo";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { Project, SkillItem, SocialLinkItem } from "@/types/sanity";

// schema.org graphs built only from content the page actually renders. No
// ratings, reviews, awards, employers or credentials: none of those are on the
// site, and structured data that overstates the page is a penalty, not a win.

const HOME_URL = `${siteUrl}/`;
const PERSON_ID = `${siteUrl}/#person`;
const WEBSITE_ID = `${siteUrl}/#website`;

// sameAs means "a page that identifies this person", so only profile links
// qualify: a mailto:, tel: or wa.me chat deep link is a way to contact Mario,
// not a profile of him, and the WhatsApp one would put his number in
// machine-readable markup for no benefit.
function profileUrls(socialLinks: SocialLinkItem[]): string[] {
  const hrefs = socialLinks
    .filter((link) => link.linkType === "url" || link.linkType === null)
    .map((link) => socialHref(link))
    .filter((href): href is string => href !== null && /^https?:\/\//i.test(href));
  return [...new Set(hrefs)];
}

type HomeInput = {
  /** The hero's role tag, rendered above the name. */
  roleTag: string | null;
  /** The Skills grid, which is what `knowsAbout` claims. */
  skills: SkillItem[];
  socialLinks: SocialLinkItem[];
};

export function homeJsonLd({ roleTag, skills, socialLinks }: HomeInput): Record<string, unknown> {
  const knowsAbout = skills
    .map((skill) => skill.title?.trim())
    .filter((title): title is string => Boolean(title));
  const sameAs = profileUrls(socialLinks);
  const jobTitle = roleTag?.trim();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: siteSettings.name,
        url: HOME_URL,
        image: absoluteUrl("/hero-img-white.png"),
        description: siteSettings.description,
        ...(jobTitle ? { jobTitle } : {}),
        ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: HOME_URL,
        name: siteSettings.name,
        description: siteSettings.description,
        inLanguage: "en",
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#webpage`,
        url: HOME_URL,
        name: `${siteSettings.name} — ${siteSettings.role}`,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
        about: { "@id": PERSON_ID },
        inLanguage: "en",
      },
    ],
  };
}

// CreativeWork rather than SoftwareApplication: the CMS holds no application
// category, operating system or price, and SoftwareApplication without them is
// an incomplete claim.
export function projectJsonLd(project: Project, slug: string): Record<string, unknown> {
  const url = absoluteUrl(projectPath(slug));
  const title = projectTitle(project);
  const thumbnail = project.thumbnail?.url;
  const keywords = project.techStack?.filter(Boolean) ?? [];
  const related = [project.liveProjectUrl, project.sourceCodeUrl]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value) && /^https?:\/\//i.test(value!));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#project`,
        name: title,
        description: projectDescription(project),
        url,
        inLanguage: "en",
        author: { "@type": "Person", name: siteSettings.name, url: HOME_URL },
        ...(thumbnail ? { image: absoluteUrl(thumbnail) } : {}),
        ...(keywords.length > 0 ? { keywords } : {}),
        ...(related.length > 0 ? { sameAs: related } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: HOME_URL },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/#projects` },
          { "@type": "ListItem", position: 3, name: title },
        ],
      },
    ],
  };
}
