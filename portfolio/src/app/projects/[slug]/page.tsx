import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { getProjectBySlug, getProjectSlugs, getSocialLinks } from "@/lib/cms";
import { getSiteSettings } from "@/lib/content";
import { projectMetadata } from "@/lib/seo";
import { projectJsonLd } from "@/lib/structuredData";

// Same window as the homepage, so a project published in the Studio shows up
// here, on the homepage and in the sitemap together.
export const revalidate = 60;

// One page per project that has a slug. A project added after the last build
// is rendered on demand and then cached, so publishing needs no redeploy.
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  // The page itself calls notFound(), which is what sets the 404 status. This
  // only stops an unknown slug from inheriting the homepage's canonical.
  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } };
  }

  return projectMetadata(project, slug);
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const site = getSiteSettings();

  // getProjectBySlug reads the same cache()'d list as generateMetadata, so the
  // two cannot describe different projects.
  const [project, socialLinks] = await Promise.all([getProjectBySlug(slug), getSocialLinks()]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <Header name={site.name} socialLinks={socialLinks} variant="sub" />
      <main id="main" tabIndex={-1} className="flex-1">
        <ProjectDetail project={project} />
      </main>
      <Footer links={socialLinks} />
      <JsonLd data={projectJsonLd(project, slug)} />
    </>
  );
}
