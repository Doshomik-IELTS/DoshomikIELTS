import type { ResourceCategory } from "@prisma/client";

export const RESOURCE_CATEGORY_OPTIONS: { value: ResourceCategory; label: string }[] = [
  { value: "basic_english", label: "Basic English" },
  { value: "words", label: "Vocabulary / words" },
  { value: "synonyms", label: "Synonyms" },
  { value: "grammar", label: "Grammar" },
  { value: "reading_strategy", label: "Reading strategy" },
  { value: "listening_strategy", label: "Listening strategy" },
  { value: "writing_strategy", label: "Writing strategy" },
  { value: "speaking_strategy", label: "Speaking strategy" },
];

export const RESOURCE_CATEGORY_VALUES = RESOURCE_CATEGORY_OPTIONS.map((o) => o.value) as [
  ResourceCategory,
  ...ResourceCategory[],
];

export const RESOURCE_CATEGORY_HELP: Record<ResourceCategory, string> = {
  basic_english: "Short foundation lessons for learners who need basic English before IELTS practice.",
  words: "Vocabulary entries should use original definitions, learner-friendly examples, and usage notes.",
  synonyms: "Include register, collocation, and misuse warnings so learners do not swap words mechanically.",
  grammar: "Explain one rule clearly, then include short examples or drills in the examples section.",
  reading_strategy: "Teach reading skills and question approaches. Full timed passages belong in mock tests.",
  listening_strategy: "Text-only strategy content is fine for v1. Do not attach commercial book audio.",
  writing_strategy: "Keep prompts and examples original. Do not copy commercial IELTS model answers.",
  speaking_strategy: "Use original questions, cue-card ideas, and sample answer notes.",
};

export function resourceCategoryLabel(value: string) {
  return RESOURCE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function difficultyLabel(value: string) {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function moduleLabel(value: string) {
  const labels: Record<string, string> = {
    listening: "Listening",
    reading: "Reading",
    writing: "Writing",
    speaking: "Speaking",
    general: "General",
  };
  return labels[value] ?? value;
}

export function resourceStatusLabel(value: string) {
  return RESOURCE_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export const DIFFICULTY_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export const RESOURCE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;
