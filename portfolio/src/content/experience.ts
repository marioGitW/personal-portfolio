import type { ExperienceItem } from "@/lib/types";

export const experience: ExperienceItem[] = [
  {
    company: "Endava",
    role: "Software Engineering Intern",
    employmentType: "Internship",
    mode: "On-site",
    dateRange: "2 Months",
    logo: "/DAVA.svg",
    bullets: [
      "Developed an internal application for tracking employee activities and learning progress.",
      "Developed features using .NET 10, React, MSSQL, and Tailwind CSS.",
      "Worked in an Agile/Scrum environment with GitFlow and presented the application to company stakeholders.",
    ],
  },
  {
    company: "Motion Source LLC",
    role: "Web Developer Intern",
    employmentType: "Internship",
    mode: "Remote",
    dateRange: "1 Month",
    logo: "/motion-source.png",
    bullets: [
      "Collaborated with interns and developers in a remote, English-speaking team.",
      "Developed features using Next.js, React, Keystone.js, and GraphQL.",
      "Used Cursor and AI-assisted development, improving prompting, context management, and workflow.",
    ],
  },
  {
    company: "Computer Repair & Sales",
    role: "Freelance Technician",
    employmentType: "Freelance",
    mode: "Freelance",
    dateRange: "2022 — Present",
    bullets: [
      "Repaired and upgraded computers, developing strong PC hardware and troubleshooting skills.",
      "Advised customers on technical solutions and computer components based on their needs and budget.",
    ],
  },
];
