import type { LucideIcon } from "lucide-react";
import { Book, BookOpen } from "lucide-react";

/**
 * A topic is a clickable block on a module hub page.
 * Each topic maps to one or more resources by slug.
 */
export interface ModuleTopic {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  resourceSlugs: string[];
}

/**
 * Topics organized by module slug.
 * Topics for each module appear as blocks on the module hub page.
 */
export const MODULE_TOPICS: Record<string, ModuleTopic[]> = {
  foundations: [
    {
      slug: "top-vocab",
      label: "Top 40 Vocabulary",
      description: "40 high-frequency IELTS words with definitions, synonyms, antonyms, and examples.",
      icon: BookOpen,
      resourceSlugs: ["top-40-vocabulary"],
    },
    {
      slug: "active-passive-voice",
      label: "Active & Passive Voice",
      description: "Master active and passive voice to achieve Band 7+ grammatical range in Writing and Speaking.",
      icon: Book,
      resourceSlugs: ["active-passive-voice-guide"],
    },
  ],
  listening: [],
  reading: [],
  writing: [],
  speaking: [],
  "exam-toolkit": [],
};

export function getModuleTopics(moduleSlug: string): ModuleTopic[] {
  return MODULE_TOPICS[moduleSlug] ?? [];
}
