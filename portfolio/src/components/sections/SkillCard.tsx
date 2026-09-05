"use client";

import { AssetIcon } from "@/components/ui/AssetIcon";
import { skillIconUrl } from "@/sanity/devicon";
import type { SkillItem } from "@/types/sanity";

export function SkillCard({ skill }: { skill: SkillItem }) {
  const iconUrl = skillIconUrl(skill);

  return (
    <li className="group relative">
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 -z-10 rounded-xl bg-accent-gradient opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-25"
      />
      <div className="surface-card relative flex min-h-[86px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-2.5 text-center shadow-sm transition-transform duration-300 group-hover:-translate-y-1 sm:min-h-[100px] sm:p-3">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-white/10"
        />

        <span className="relative grid size-7 place-items-center sm:size-9">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-accent-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50"
          />
          <AssetIcon
            src={iconUrl}
            alt=""
            className="relative size-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-110"
          />
        </span>

        <div className="relative">
          <p className="text-[11px] leading-tight font-semibold text-foreground transition-colors duration-300 group-hover:text-indigo-500 sm:text-xs dark:group-hover:text-cyan-300">
            {skill.title}
          </p>
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-1/2 h-0.5 w-5 origin-center -translate-x-1/2 scale-x-0 bg-accent-gradient transition-transform duration-300 group-hover:scale-x-100"
          />
        </div>
      </div>
    </li>
  );
}
