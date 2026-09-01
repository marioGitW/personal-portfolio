import type { Skill } from "@/lib/types";

const devicon = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

export const skills: Skill[] = [
  { name: "Java", category: "Languages", icon: devicon("java/java-original.svg") },
  { name: "C#", category: "Languages", icon: devicon("csharp/csharp-original.svg") },
  { name: "TypeScript", category: "Languages", icon: devicon("typescript/typescript-original.svg") },
  { name: "JavaScript", category: "Languages", icon: devicon("javascript/javascript-original.svg") },
  { name: "React", category: "Frontend", icon: devicon("react/react-original.svg") },
  { name: "Next.js", category: "Frontend", icon: devicon("nextjs/nextjs-original.svg") },
  { name: "Tailwind CSS", category: "Frontend", icon: devicon("tailwindcss/tailwindcss-original.svg") },
  { name: ".NET", category: "Backend", icon: devicon("dotnetcore/dotnetcore-original.svg") },
  { name: "Spring Boot", category: "Backend", icon: devicon("spring/spring-original.svg") },
  { name: "PostgreSQL", category: "Databases", icon: devicon("postgresql/postgresql-original.svg") },
  { name: "SQL Server", category: "Databases", icon: devicon("microsoftsqlserver/microsoftsqlserver-plain.svg") },
  { name: "Docker", category: "Tools", icon: devicon("docker/docker-original.svg") },
  { name: "Kubernetes", category: "Tools", icon: devicon("kubernetes/kubernetes-plain.svg") },
  { name: "Git", category: "Tools", icon: devicon("git/git-original.svg") },
  { name: "Figma", category: "Tools", icon: devicon("figma/figma-original.svg") },
];
