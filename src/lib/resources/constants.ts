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
