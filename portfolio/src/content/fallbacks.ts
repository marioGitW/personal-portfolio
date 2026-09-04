import type { About, Experience, Hero, Project, Skills } from "@/types/sanity";

// Every hardcoded content value lives here: fallbacks for when the CMS is empty
// or unreachable, plus static copy that has no CMS field at all.

// Site-level values with no CMS equivalent (layout metadata + footer).
export const siteSettings = {
  name: "Mario Spasovski",
  role: "Aspiring Software Engineer",
  tagline: "Curious about technology. Passionate about building things that make sense.",
  email: "mrspasovski@gmail.com",
} as const;

export const heroFallback: Hero = {
  roleTag: "Aspiring Software Engineer",
  mainTitle: "Mario Spasovski",
  subtitle: "Curious about technology. Passionate about building things that make sense.",
};

export const aboutFallback: About = {
  description: [
    "Hey, I'm Mario - a Computer Science and Engineering student in my final year at FINKI.",
    "I enjoy building things and turning ideas into something real and useful. I like getting hands-on and figuring things out.",
    "I'm naturally curious about technology and like keeping up with what's new. When something genuinely interests me, I tend to dive deep into it and dedicate myself to getting better at it.",
    "Outside of coding, I enjoy team and competitive games. I like the combination of teamwork, strategy, problem-solving, and competition, and I think that mindset carries over into the things I work on.",
  ].join("\n\n"),
  tags: [
    { _key: "fallback-age", highlightedText: "22", description: "Years old" },
    { _key: "fallback-year", highlightedText: "4th", description: "Year student" },
    { _key: "fallback-available", highlightedText: "24/7", description: "Available" },
    { _key: "fallback-languages", highlightedText: "3", description: "Languages" },
  ],
};

export const experienceFallback: Experience = {
  experienceDescription:
    "My path so far — from software engineering internships at Endava and Motion Source to freelance computer repair work, picking up modern tools and Agile practices along the way.",
  experienceItems: [
    {
      _key: "fallback-endava",
      order: 1,
      name: "Endava",
      place: "On-site",
      position: "Software Engineering Intern",
      type: "Internship",
      durationMonths: 2,
      durationLabel: null,
      iconUrl: "/DAVA.svg",
      iconMimeType: "image/svg+xml",
      keyFeatures: [
        "Developed an internal application for tracking employee activities and learning progress.",
        "Developed features using .NET 10, React, MSSQL, and Tailwind CSS.",
        "Worked in an Agile/Scrum environment with GitFlow and presented the application to company stakeholders.",
      ],
    },
    {
      _key: "fallback-motion-source",
      order: 2,
      name: "Motion Source LLC",
      place: "Remote",
      position: "Web Developer Intern",
      type: "Internship",
      durationMonths: 1,
      durationLabel: null,
      iconUrl: "/motion-source.png",
      iconMimeType: "image/png",
      keyFeatures: [
        "Collaborated with interns and developers in a remote, English-speaking team.",
        "Developed features using Next.js, React, Keystone.js, and GraphQL.",
        "Used Cursor and AI-assisted development, improving prompting, context management, and workflow.",
      ],
    },
    {
      _key: "fallback-freelance",
      order: 3,
      name: "Computer Repair & Sales",
      place: "Freelance",
      position: "Freelance Technician",
      type: "Freelance",
      // Ongoing role, so the label is used instead of a month count.
      durationMonths: null,
      durationLabel: "2022 — Present",
      iconUrl: null,
      iconMimeType: null,
      keyFeatures: [
        "Repaired and upgraded computers, developing strong PC hardware and troubleshooting skills.",
        "Advised customers on technical solutions and computer components based on their needs and budget.",
      ],
    },
  ],
};

const devicon = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

const fallbackSkill = (title: string, path: string) => ({
  _key: `fallback-${path}`,
  title,
  deviconPath: devicon(path),
  iconUrl: null,
  iconMimeType: null,
});

export const skillsFallback: Skills = {
  skillItems: [
    fallbackSkill("Java", "java/java-original.svg"),
    fallbackSkill("C#", "csharp/csharp-original.svg"),
    fallbackSkill("TypeScript", "typescript/typescript-original.svg"),
    fallbackSkill("JavaScript", "javascript/javascript-original.svg"),
    fallbackSkill("React", "react/react-original.svg"),
    fallbackSkill("Next.js", "nextjs/nextjs-original.svg"),
    fallbackSkill("Tailwind CSS", "tailwindcss/tailwindcss-original.svg"),
    fallbackSkill(".NET", "dotnetcore/dotnetcore-original.svg"),
    fallbackSkill("Spring Boot", "spring/spring-original.svg"),
    fallbackSkill("PostgreSQL", "postgresql/postgresql-original.svg"),
    fallbackSkill("SQL Server", "microsoftsqlserver/microsoftsqlserver-plain.svg"),
    fallbackSkill("Docker", "docker/docker-original.svg"),
    fallbackSkill("Kubernetes", "kubernetes/kubernetes-plain.svg"),
    fallbackSkill("Git", "git/git-original.svg"),
    fallbackSkill("Figma", "figma/figma-original.svg"),
  ],
};

const localImage = (url: string) => ({ url, lqip: null, aspectRatio: null });

export const projectsFallback: Project[] = [
  {
    _id: "fallback-phone-price-aggregator",
    order: 1,
    title: "Phone Price Aggregator",
    slug: "phone-price-aggregator",
    featured: true,
    thumbnailTag: "Full-Stack Application",
    thumbnailTitle: "Phone Price Aggregator",
    thumbnailDescription:
      "Compares mobile phone prices from multiple retailers in North Macedonia in one place.",
    thumbnail: localImage("/project1.webp"),
    screenshots: [
      { _key: "fb-ppa-1", ...localImage("/project1.webp") },
      { _key: "fb-ppa-2", ...localImage("/project2.webp") },
      { _key: "fb-ppa-3", ...localImage("/project5.webp") },
    ],
    demoVideoUrl: null,
    techStack: ["React", "TypeScript", "Spring Boot", "PostgreSQL", "Python"],
    projectOverview:
      "Phone Price Aggregator is a full-stack application designed to collect and compare mobile phone prices from multiple retailers in North Macedonia. It normalizes listings from each source and presents them in a single searchable view, so buyers can quickly find the best price for the phone they want.",
    keyFeatures: [
      "Aggregates and normalizes listings from multiple North Macedonian retailers.",
      "Searchable, filterable price comparison across brands and models.",
      "Scheduled scraping pipeline keeps prices up to date automatically.",
    ],
    liveProjectUrl: null,
    sourceCodeUrl: null,
  },
  {
    _id: "fallback-personal-portfolio",
    order: 2,
    title: "Personal Portfolio",
    slug: "personal-portfolio",
    featured: false,
    thumbnailTag: "Frontend",
    thumbnailTitle: "Personal Portfolio",
    thumbnailDescription: "This site — a fast, animated portfolio built with Next.js and GSAP.",
    thumbnail: localImage("/project5.webp"),
    screenshots: [
      { _key: "fb-pp-1", ...localImage("/project5.webp") },
      { _key: "fb-pp-2", ...localImage("/project3.webp") },
      { _key: "fb-pp-3", ...localImage("/project4.avif") },
    ],
    demoVideoUrl: null,
    techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP"],
    projectOverview:
      "The portfolio you're browsing right now. Built with Next.js and Tailwind CSS, with GSAP driving the scroll-triggered reveals and interaction animations throughout the site.",
    keyFeatures: [
      "Scroll-triggered GSAP reveals across every section.",
      "Full dark/light theme support with theme-aware accent colors.",
      "Reusable, data-driven components ready to plug into a CMS.",
    ],
    liveProjectUrl: null,
    sourceCodeUrl: null,
  },
  {
    _id: "fallback-team-activity-tracker",
    order: 3,
    title: "Team Activity Tracker",
    slug: "team-activity-tracker",
    featured: false,
    thumbnailTag: "Internal Tool",
    thumbnailTitle: "Team Activity Tracker",
    thumbnailDescription: "An internal app for tracking employee activity and learning progress.",
    thumbnail: localImage("/project2.webp"),
    screenshots: [
      { _key: "fb-tat-1", ...localImage("/project2.webp") },
      { _key: "fb-tat-2", ...localImage("/project1.webp") },
      { _key: "fb-tat-3", ...localImage("/project3.webp") },
    ],
    demoVideoUrl: null,
    techStack: [".NET", "React", "MSSQL", "Tailwind CSS"],
    projectOverview:
      "An internal application built to track employee activity and learning progress for a software team, developed in an Agile/Scrum environment as part of a software engineering internship.",
    keyFeatures: [
      "Tracks employee activity and learning progress in one dashboard.",
      "Role-based views for individual contributors and team leads.",
      "Built and shipped in an Agile/Scrum workflow with GitFlow.",
    ],
    liveProjectUrl: null,
    sourceCodeUrl: null,
  },
];

// Languages shown in the About panel. No CMS field exists for these.
export const aboutLanguages = [
  { code: "MK", label: "Macedonian" },
  { code: "GB", label: "English" },
  { code: "RS", label: "Serbian" },
] as const;

// Section headings and eyebrows that are not editable from the CMS.
export const sectionCopy = {
  about: {
    eyebrow: "About",
    titleLead: "About",
    titleAccent: "Me",
  },
  experience: {
    eyebrow: "Journey",
    titleLead: "Where I've built real",
    titleAccent: "experience",
  },
  projects: {
    eyebrow: "Projects",
    titleLead: "Best",
    titleAccent: "Works",
    description: "A selection of things I've built — click a project to see more.",
  },
  skills: {
    eyebrow: "What I work with",
    title: "Skills",
    description:
      "How I approach engineering, and the tools I reach for when building and shipping software.",
    radarLabel: "Engineering Profile",
    toolsLabel: "Tools & Technologies",
  },
} as const;
