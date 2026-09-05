import { About } from "@/components/sections/About";
import { ActivityCounter } from "@/components/sections/ActivityCounter";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { JsonLd } from "@/components/seo/JsonLd";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { getPortfolioContent, getProjectList, getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";
import { homeJsonLd } from "@/lib/structuredData";

// Re-fetch at most once a minute, so publishing in the Studio shows up
// without a redeploy.
export const revalidate = 60;

export default async function Home() {
  const site = getSiteSettings();

  // Two round trips, not three: getPortfolioContent and getSocialLinks share
  // the cached portfolio document.
  const [content, projects, socialLinks] = await Promise.all([
    getPortfolioContent(),
    getProjectList(),
    getSocialLinks(),
  ]);

  return (
    <>
      <Header name={site.name} socialLinks={socialLinks} />
      <main id="main" tabIndex={-1} className="flex-1">
        <Hero hero={content.hero} />
        <About about={content.about} />
        <Experience experience={content.experience} />
        <Projects projects={projects} />
        <Skills skills={content.skills} />
        <Contact />
        <ActivityCounter />
      </main>
      <Footer links={socialLinks} />
      {/* Person / WebSite / ProfilePage, built only from what this page renders:
          the hero role tag, the Skills grid and the CMS social links. */}
      <JsonLd
        data={homeJsonLd({
          roleTag: content.hero.roleTag,
          skills: content.skills.skillItems ?? [],
          socialLinks,
        })}
      />
    </>
  );
}
