import { About } from "@/components/sections/About";
import { ActivityCounter } from "@/components/sections/ActivityCounter";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { getPortfolioContent, getProjectList, getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";

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
      <Header name={site.name} />
      <main className="flex-1">
        <Hero hero={content.hero} />
        <About about={content.about} />
        <Experience experience={content.experience} />
        <Projects projects={projects} />
        <Skills skills={content.skills} />
        <Contact />
        <ActivityCounter />
      </main>
      <Footer links={socialLinks} />
    </>
  );
}
