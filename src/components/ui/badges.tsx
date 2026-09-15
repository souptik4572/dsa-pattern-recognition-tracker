import { cn } from "@/lib/cn";
import { DIFFICULTY_LABEL, TIER_LABEL, type Difficulty, type Tier } from "@/lib/sheet/meta";

const tag = "inline-flex h-5 items-center rounded-[2px] border px-1.5 font-mono text-[10px] tracking-wider uppercase";

const difficultyClass: Record<Difficulty, string> = {
  EASY: "border-current text-easy",
  MEDIUM: "border-current text-medium",
  HARD: "border-current text-hard",
};

const tierClass: Record<Tier, string> = {
  CORE: "border-ink bg-ink text-card",
  REP: "border-rule text-ink-2",
  BOSS: "border-hard/40 bg-hard/10 text-hard",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={cn(tag, difficultyClass[difficulty])}>{DIFFICULTY_LABEL[difficulty]}</span>;
}

export function TierBadge({ tier }: { tier: Tier }) {
  return <span className={cn(tag, tierClass[tier])}>{TIER_LABEL[tier]}</span>;
}
