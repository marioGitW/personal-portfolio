import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { NameRevealSection } from "@/components/sections/NameRevealSection";
import { Profiles } from "@/components/sections/Profiles";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { getSiteSettings } from "@/lib/content";

export default function Home() {
  const site = getSiteSettings();

  return (
    <>
      <Header name={site.name} />
      <main className="flex-1">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Profiles />
        <Contact />
        <NameRevealSection />
      </main>
      <Footer />
    </>
  );
}
