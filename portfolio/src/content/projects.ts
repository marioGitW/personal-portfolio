import type { Project } from "@/lib/types";

// Local mock data for now. `getProjects()` in `lib/content.ts` is the only
// place the rest of the app reads from — swapping this for a CMS fetch later
// means changing that one function, not the UI components. Every optional
// field below is populated so the full modal experience (screenshots
// slider, tech stack, overview, key features, links) is easy to review;
// `demoVideoUrl` is only set on one project, as a placeholder, since none
// of these have a real demo recording yet.
export const projects: Project[] = [
  {
    id: "phone-price-aggregator",
    slug: "phone-price-aggregator",
    title: "Phone Price Aggregator",
    category: "Full-Stack Application",
    date: "2025",
    shortDescription:
      "Compares mobile phone prices from multiple retailers in North Macedonia in one place.",
    description:
      "Phone Price Aggregator is a full-stack application designed to collect and compare mobile phone prices from multiple retailers in North Macedonia. It normalizes listings from each source and presents them in a single searchable view, so buyers can quickly find the best price for the phone they want.",
    technologies: ["React", "TypeScript", "Spring Boot", "PostgreSQL", "Python"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    featured: true,
    coverImage: "/project1.webp",
    screenshots: ["/project1.webp", "/project2.webp", "/project5.webp"],
    demoVideoUrl: "placeholder",
    keyFeatures: [
      "Aggregates and normalizes listings from multiple North Macedonian retailers.",
      "Searchable, filterable price comparison across brands and models.",
      "Scheduled scraping pipeline keeps prices up to date automatically.",
    ],
  },
  {
    id: "personal-portfolio",
    slug: "personal-portfolio",
    title: "Personal Portfolio",
    category: "Frontend",
    date: "2026",
    shortDescription: "This site — a fast, animated portfolio built with Next.js and GSAP.",
    description:
      "The portfolio you're browsing right now. Built with Next.js and Tailwind CSS, with GSAP driving the scroll-triggered reveals and interaction animations throughout the site.",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    coverImage: "/project5.webp",
    screenshots: ["/project5.webp", "/project3.webp", "/project4.avif"],
    keyFeatures: [
      "Scroll-triggered GSAP reveals across every section.",
      "Full dark/light theme support with theme-aware accent colors.",
      "Reusable, data-driven components ready to plug into a CMS.",
    ],
  },
  {
    id: "team-activity-tracker",
    slug: "team-activity-tracker",
    title: "Team Activity Tracker",
    category: "Internal Tool",
    date: "2025",
    shortDescription: "An internal app for tracking employee activity and learning progress.",
    description:
      "An internal application built to track employee activity and learning progress for a software team, developed in an Agile/Scrum environment as part of a software engineering internship.",
    technologies: [".NET", "React", "MSSQL", "Tailwind CSS"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    coverImage: "/project2.webp",
    screenshots: ["/project2.webp", "/project1.webp", "/project3.webp"],
    keyFeatures: [
      "Tracks employee activity and learning progress in one dashboard.",
      "Role-based views for individual contributors and team leads.",
      "Built and shipped in an Agile/Scrum workflow with GitFlow.",
    ],
  },
  {
    id: "market-insights",
    slug: "market-insights",
    title: "Market Insights",
    category: "Mobile App",
    date: "2024",
    shortDescription: "A mobile dashboard for tracking stock indices and sector performance.",
    description:
      "Market Insights is a mobile-first dashboard that pulls live market data and presents index movement, sector breakdowns, and investor activity in a single, glanceable feed. Built to make dense financial data easy to read at a glance.",
    technologies: ["React Native", "TypeScript", "GraphQL", "Node.js"],
    liveUrl: "https://example.com",
    githubUrl: "https://github.com",
    coverImage: "/project3.webp",
    screenshots: ["/project3.webp", "/project4.avif", "/project1.webp"],
    keyFeatures: [
      "Live index and sector data with per-minute refresh.",
      "Investor-type breakdown for institutional vs. retail flow.",
      "Offline-friendly caching for the last synced snapshot.",
    ],
  },
];
