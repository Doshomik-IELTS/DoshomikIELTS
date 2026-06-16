import type { ResourceCategory } from "@prisma/client";
import {
  BookOpenText,
  Headphones,
  BookMarked,
  PencilLine,
  Mic,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface ResourceModule {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string; // Tailwind bg/hover class
  categories: ResourceCategory[];
}

export const RESOURCE_MODULES: ResourceModule[] = [
  {
    slug: "foundations",
    label: "Foundations",
    description: "Vocabulary, grammar, spelling, and pronunciation — build your English bedrock.",
    icon: BookOpenText,
    color: "blue",
    categories: ["basic_english", "words", "synonyms", "grammar"],
  },
  {
    slug: "listening",
    label: "Listening",
    description: "Strategies, question types, and scenario-based practice for the Listening test.",
    icon: Headphones,
    color: "emerald",
    categories: ["listening_strategy"],
  },
  {
    slug: "reading",
    label: "Reading",
    description: "Reading strategies, question types, and passage walkthroughs for the Reading test.",
    icon: BookMarked,
    color: "purple",
    categories: ["reading_strategy"],
  },
  {
    slug: "writing",
    label: "Writing",
    description: "Task 1 & Task 2 strategies, sample answers, and band descriptor guides.",
    icon: PencilLine,
    color: "orange",
    categories: ["writing_strategy"],
  },
  {
    slug: "speaking",
    label: "Speaking",
    description: "Part 1, 2 & 3 strategies, cue-card ideas, and sample answer walkthroughs.",
    icon: Mic,
    color: "rose",
    categories: ["speaking_strategy"],
  },
  {
    slug: "exam-toolkit",
    label: "Exam Toolkit",
    description: "Study plans, band descriptors, common topics, and exam-day strategies.",
    icon: ClipboardList,
    color: "slate",
    categories: [],
  },
] as const;

export const MODULE_BY_SLUG = Object.fromEntries(
  RESOURCE_MODULES.map((m) => [m.slug, m]),
) as Record<string, ResourceModule>;

export function getModuleForCategory(category: ResourceCategory): ResourceModule | undefined {
  return RESOURCE_MODULES.find((m) => m.categories.includes(category));
}

export function getModuleSlugByCategory(category: ResourceCategory): string | undefined {
  return getModuleForCategory(category)?.slug;
}
