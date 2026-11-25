"use client";

import { AssetIcon } from "@/components/ui/AssetIcon";
import { HudFrame } from "@/components/ui/hud-frame";
import { skillIconUrl } from "@/sanity/devicon";
import type { SkillItem } from "@/types/sanity";

type SkillCardProps = {
  skill: SkillItem;
  /** On the page being shown. The others have no entrance. */
  reveal: boolean;
};

export function SkillCard({ skill, reveal }: SkillCardProps) {
  const iconUrl = skillIconUrl(skill);

  return (
    <HudFrame
      as="li"
      size="sm"
      interactive
      reveal={reveal}
      className="flex min-h-[86px] flex-col items-center justify-center p-2.5 text-center sm:min-h-[100px] sm:p-3"
    >
      <div data-hud-item className="flex flex-col items-center gap-2">
        <span className="hud-lift grid size-7 place-items-center sm:size-9">
          <AssetIcon src={iconUrl} alt="" className="size-full object-contain p-0.5" />
        </span>
        <p className="text-[11px] leading-tight font-semibold text-foreground sm:text-xs">
          {skill.title}
        </p>
      </div>
    </HudFrame>
  );
}
