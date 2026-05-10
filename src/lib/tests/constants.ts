import type { TestType, ContentStatus } from "@prisma/client";

export const TEST_TYPE_OPTIONS: { value: TestType; label: string }[] = [
  { value: "practice", label: "Practice" },
  { value: "short_mock", label: "Short Mock" },
  { value: "full_mock", label: "Full Mock" },
];

export const TEST_TYPE_VALUES = TEST_TYPE_OPTIONS.map((o) => o.value) as [
  TestType,
  ...TestType[],
];

export const TEST_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export const TEST_STATUS_VALUES = TEST_STATUS_OPTIONS.map((o) => o.value) as [
  ContentStatus,
  ...ContentStatus[],
];