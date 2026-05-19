import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/observability/logger";
import { strapiCircuitBreaker } from "@/lib/resilience/external-services";
import { withTimeout } from "@/lib/resilience/circuit-breaker";

export const STRAPI_ID_PREFIX = "strapi_";

type StrapiEntry = Record<string, unknown>;

type StrapiListResponse = {
  data?: unknown;
  meta?: unknown;
};

export type StrapiResourceSummary = {
  id: string;
  strapiDocumentId: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  banglaTitle: string | null;
  banglaSummary: string | null;
  tags: string[];
  createdAt: string | null;
  saved?: boolean;
};

export type StrapiResourceDetail = StrapiResourceSummary & {
  body: string;
  banglaTranslation: string | null;
  examplesJson: unknown;
  vocabularyItemsJson: unknown;
  publishedAt: string | null;
};

export type StrapiMockTestSummary = {
  id: string;
  strapiDocumentId: string;
  title: string;
  type: string;
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  modules: string[];
  sections: number;
};

type NormalizedSection = {
  id: string;
  module: "listening" | "reading" | "writing" | "speaking";
  partNumber: number | null;
  title: string;
  instructions: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  contentJson: Prisma.InputJsonValue | undefined;
  groups: NormalizedGroup[];
  questions: NormalizedQuestion[];
};

type NormalizedGroup = {
  id: string;
  title: string;
  instructions: string;
  questionType: string;
  orderIndex: number;
  displayJson: Prisma.InputJsonValue | undefined;
};

type NormalizedQuestion = {
  id: string;
  groupId: string | null;
  questionType: string;
  prompt: string;
  optionsJson: Prisma.InputJsonValue | undefined;
  orderIndex: number;
  difficulty: "basic" | "intermediate" | "advanced";
  explanation: string | null;
  sourceSpanJson: Prisma.InputJsonValue | undefined;
  answerKey: {
    canonicalAnswer: string;
    acceptedAnswersJson: Prisma.InputJsonValue | undefined;
    scoringRuleJson: Prisma.InputJsonValue | undefined;
    explanation: string | null;
  } | null;
};

type NormalizedMockTest = {
  id: string;
  strapiDocumentId: string;
  title: string;
  description: string | null;
  type: "practice" | "short_mock" | "full_mock";
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  sections: NormalizedSection[];
};

function isPublishedResource(resource: StrapiResourceDetail | null | undefined) {
  return Boolean(resource?.publishedAt);
}

function isPublishedMockTest(test: NormalizedMockTest | null | undefined) {
  return Boolean(test?.publishedAt);
}

function strapiBaseUrl() {
  return process.env.STRAPI_BASE_URL?.replace(/\/$/, "") || "";
}

export function strapiAdminUrl(path = "") {
  const base = process.env.STRAPI_ADMIN_URL?.replace(/\/$/, "") || `${strapiBaseUrl()}/admin`;
  return `${base}${path}`;
}

export function strapiEnabled() {
  return Boolean(strapiBaseUrl() && process.env.STRAPI_API_TOKEN);
}

export function isStrapiId(id: string) {
  return id.startsWith(STRAPI_ID_PREFIX);
}

function appId(documentId: string | number) {
  return `${STRAPI_ID_PREFIX}${String(documentId)}`;
}

function documentIdFromAppId(id: string) {
  return isStrapiId(id) ? id.slice(STRAPI_ID_PREFIX.length) : id;
}

function entry(value: unknown): StrapiEntry {
  if (!value || typeof value !== "object") return {};
  const raw = value as StrapiEntry;
  const attrs = raw.attributes;
  if (attrs && typeof attrs === "object") {
    return { id: raw.id, documentId: raw.documentId, ...(attrs as StrapiEntry) };
  }
  return raw;
}

function collection(value: unknown): StrapiEntry[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(entry);
  if (typeof value === "object") {
    const raw = value as { data?: unknown };
    if (Array.isArray(raw.data)) return raw.data.map(entry);
  }
  return [];
}

function componentCollection(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.map(entry);
  return collection(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return value as Prisma.InputJsonValue;
}

function tagsValue(value: unknown, tagItems?: unknown) {
  const tags = Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === "string")
    : [];
  const componentTags = componentCollection(tagItems)
    .map((tag) => stringValue(entry(tag).label))
    .filter(Boolean);
  return Array.from(new Set([...tags, ...componentTags]));
}

function linesValue(value: unknown) {
  return stringValue(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionContentValue(section: StrapiEntry): Prisma.InputJsonValue | undefined {
  const base =
    section.content && typeof section.content === "object" && !Array.isArray(section.content)
      ? { ...(section.content as Record<string, unknown>) }
      : {};

  const passageText = stringValue(section.passageText);
  const transcript = stringValue(section.transcript);
  const writingPrompt = stringValue(section.writingPrompt);
  const speakingPrompt = stringValue(section.speakingPrompt);

  if (passageText && !base.passageText) base.passageText = passageText;
  if (transcript && !base.transcript) base.transcript = transcript;
  if (writingPrompt && !base.writingPrompt) base.writingPrompt = writingPrompt;
  if (speakingPrompt && !base.speakingPrompt) base.speakingPrompt = speakingPrompt;

  return Object.keys(base).length > 0 ? (base as Prisma.InputJsonValue) : undefined;
}

async function strapiFetch<T>(path: string): Promise<T | null> {
  if (!strapiEnabled()) return null;

  try {
    return await strapiCircuitBreaker.execute(async () => {
      const res = await withTimeout(
        (signal) =>
          fetch(`${strapiBaseUrl()}${path}`, {
            headers: {
              Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
            cache: "no-store",
            signal,
          }),
        4000,
        "Strapi request timed out",
      );

      if (!res.ok) {
        throw new Error(`Strapi returned ${res.status}`);
      }

      return (await res.json()) as T;
    });
  } catch (error) {
    logger.warn("strapi fetch failed", {
      path,
      error: error instanceof Error ? error.message : String(error),
      circuit: strapiCircuitBreaker.status(),
    });
    return null;
  }
}

function resourceFromEntry(raw: unknown): StrapiResourceDetail | null {
  const r = entry(raw);
  const documentId = stringValue(r.documentId, String(r.id ?? ""));
  if (!documentId) return null;
  return {
    id: appId(documentId),
    strapiDocumentId: documentId,
    title: stringValue(r.title, "Untitled resource"),
    slug: stringValue(r.slug, documentId),
    category: stringValue(r.category, "basic_english"),
    difficulty: stringValue(r.difficulty, "basic"),
    banglaTitle: nullableStringValue(r.banglaTitle),
    banglaSummary: nullableStringValue(r.banglaSummary),
    body: stringValue(r.body),
    banglaTranslation: nullableStringValue(r.banglaTranslation),
    examplesJson: componentCollection(r.examples),
    vocabularyItemsJson: componentCollection(r.vocabularyItems),
    tags: tagsValue(r.tags, r.tagItems),
    createdAt: nullableStringValue(r.createdAt),
    publishedAt: nullableStringValue(r.publishedAt),
  };
}

export async function fetchStrapiResources(params: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<StrapiResourceSummary[] | null> {
  const qs = new URLSearchParams();
  qs.set("sort[0]", "orderIndex:asc");
  qs.set("sort[1]", "publishedAt:desc");
  qs.set("pagination[pageSize]", "100");
  if (params.category) qs.set("filters[category][$eq]", params.category);
  if (params.difficulty) qs.set("filters[difficulty][$eq]", params.difficulty);
  if (params.search) qs.set("filters[title][$containsi]", params.search);

  const res = await strapiFetch<StrapiListResponse>(`/api/resources?${qs.toString()}`);
  if (!res) return null;
  return collection(res.data)
    .map(resourceFromEntry)
    .filter((r): r is StrapiResourceDetail => isPublishedResource(r))
    .map((resource): StrapiResourceSummary => ({
      id: resource.id,
      strapiDocumentId: resource.strapiDocumentId,
      title: resource.title,
      slug: resource.slug,
      category: resource.category,
      difficulty: resource.difficulty,
      banglaTitle: resource.banglaTitle,
      banglaSummary: resource.banglaSummary,
      tags: resource.tags,
      createdAt: resource.createdAt,
      saved: resource.saved,
    }));
}

export async function fetchStrapiResource(id: string): Promise<StrapiResourceDetail | null> {
  const documentId = documentIdFromAppId(id);
  const qs = new URLSearchParams();
  qs.set("populate", "*");
  const res = await strapiFetch<StrapiListResponse>(`/api/resources/${documentId}?${qs.toString()}`);
  if (!res?.data) return null;
  const resource = resourceFromEntry(res.data);
  return isPublishedResource(resource) ? resource : null;
}

export async function fetchStrapiResourceBySlug(slug: string): Promise<StrapiResourceDetail | null> {
  const qs = new URLSearchParams();
  qs.set("populate", "*");
  qs.set("filters[slug][$eq]", slug);
  qs.set("pagination[pageSize]", "1");
  const res = await strapiFetch<StrapiListResponse>(`/api/resources?${qs.toString()}`);
  if (!res) return null;

  return (
    collection(res.data)
      .map(resourceFromEntry)
      .find((resource): resource is StrapiResourceDetail => isPublishedResource(resource)) ?? null
  );
}

function localResourceSlug(resource: StrapiResourceDetail, existingSlugOwnerId?: string | null) {
  if (!existingSlugOwnerId || existingSlugOwnerId === resource.id) {
    return resource.slug;
  }
  return `${resource.slug}-${resource.strapiDocumentId}`;
}

export async function ensureLocalResourceFromStrapi(id: string) {
  if (!isStrapiId(id)) return null;

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (existing) return existing;

  const resource = await fetchStrapiResource(id);
  if (!resource) return null;

  const slugOwner = await prisma.resource.findUnique({
    where: { slug: resource.slug },
    select: { id: true },
  });

  return prisma.resource.upsert({
    where: { id: resource.id },
    create: {
      id: resource.id,
      title: resource.title,
      slug: localResourceSlug(resource, slugOwner?.id),
      category: resource.category as "basic_english" | "words" | "synonyms" | "grammar" | "reading_strategy" | "listening_strategy" | "writing_strategy" | "speaking_strategy",
      difficulty: resource.difficulty as "basic" | "intermediate" | "advanced",
      body: resource.body,
      examplesJson: resource.examplesJson as Prisma.InputJsonValue | undefined,
      tags: resource.tags,
      status: "published",
      publishedAt: resource.publishedAt ? new Date(resource.publishedAt) : new Date(),
    },
    update: {
      title: resource.title,
      body: resource.body,
      examplesJson: resource.examplesJson as Prisma.InputJsonValue | undefined,
      tags: resource.tags,
      status: "published",
      publishedAt: resource.publishedAt ? new Date(resource.publishedAt) : new Date(),
    },
  });
}

function normalizeGroup(raw: unknown): NormalizedGroup | null {
  const g = entry(raw);
  const documentId = stringValue(g.documentId, String(g.id ?? ""));
  if (!documentId) return null;
  return {
    id: appId(`group_${documentId}`),
    title: stringValue(g.title),
    instructions: stringValue(g.instructions),
    questionType: stringValue(g.questionType, "short_answer"),
    orderIndex: numberValue(g.orderIndex) ?? 0,
    displayJson: jsonValue({
      ...(g.displayConfig && typeof g.displayConfig === "object" && !Array.isArray(g.displayConfig)
        ? (g.displayConfig as Record<string, unknown>)
        : {}),
      sharedOptions: componentCollection(g.sharedOptions),
    }),
  };
}

function normalizeQuestion(raw: unknown, groups: NormalizedGroup[]): NormalizedQuestion | null {
  const q = entry(raw);
  const documentId = stringValue(q.documentId, String(q.id ?? ""));
  if (!documentId) return null;

  const rawGroup = entry(q.group);
  const rawGroupDocumentId = stringValue(rawGroup.documentId, String(rawGroup.id ?? ""));
  const groupId = rawGroupDocumentId ? appId(`group_${rawGroupDocumentId}`) : null;
  const knownGroupId = groupId && groups.some((g) => g.id === groupId) ? groupId : null;
  const answerKey = entry(q.answerKey);
  const canonicalAnswer = stringValue(answerKey.canonicalAnswer);
  const acceptedAnswers = jsonValue(answerKey.acceptedAnswers) ?? jsonValue(linesValue(answerKey.acceptedAnswersText));
  const scoringRule =
    jsonValue(answerKey.scoringRule) ??
    jsonValue({
      type: stringValue(answerKey.scoringRuleType, "case_insensitive"),
      points: numberValue(answerKey.points) ?? 1,
    });

  return {
    id: appId(`question_${documentId}`),
    groupId: knownGroupId,
    questionType: stringValue(q.questionType, "short_answer"),
    prompt: stringValue(q.prompt),
    optionsJson: jsonValue(componentCollection(q.options)),
    orderIndex: numberValue(q.orderIndex) ?? 0,
    difficulty: enumValue(q.difficulty, ["basic", "intermediate", "advanced"], "basic"),
    explanation: nullableStringValue(q.explanation),
    sourceSpanJson: jsonValue(q.sourceSpan),
    answerKey: canonicalAnswer
        ? {
          canonicalAnswer,
          acceptedAnswersJson: acceptedAnswers,
          scoringRuleJson: scoringRule,
          explanation: nullableStringValue(answerKey.explanation),
        }
      : null,
  };
}

function normalizeSection(raw: unknown): NormalizedSection | null {
  const s = entry(raw);
  const documentId = stringValue(s.documentId, String(s.id ?? ""));
  if (!documentId) return null;

  const groups = collection(s.questionGroups)
    .map(normalizeGroup)
    .filter((g): g is NormalizedGroup => Boolean(g))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const questions = collection(s.questions)
    .map((q) => normalizeQuestion(q, groups))
    .filter((q): q is NormalizedQuestion => Boolean(q))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    id: appId(`section_${documentId}`),
    module: enumValue(s.module, ["listening", "reading", "writing", "speaking"], "reading"),
    partNumber: numberValue(s.partNumber),
    title: stringValue(s.title, "Section"),
    instructions: nullableStringValue(s.instructions),
    durationMinutes: numberValue(s.durationMinutes),
    orderIndex: numberValue(s.orderIndex) ?? 0,
    contentJson: sectionContentValue(s),
    groups,
    questions,
  };
}

function mockTestFromEntry(raw: unknown): NormalizedMockTest | null {
  const t = entry(raw);
  const documentId = stringValue(t.documentId, String(t.id ?? ""));
  if (!documentId) return null;
  const sections = collection(t.sections)
    .map(normalizeSection)
    .filter((s): s is NormalizedSection => Boolean(s))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    id: appId(documentId),
    strapiDocumentId: documentId,
    title: stringValue(t.title, "Untitled mock test"),
    description: nullableStringValue(t.description),
    type: enumValue(t.type, ["practice", "short_mock", "full_mock"], "short_mock"),
    estimatedDurationMinutes: numberValue(t.estimatedDurationMinutes),
    publishedAt: nullableStringValue(t.publishedAt),
    sections,
  };
}

function mockTestSummary(test: NormalizedMockTest): StrapiMockTestSummary {
  return {
    id: test.id,
    strapiDocumentId: test.strapiDocumentId,
    title: test.title,
    type: test.type,
    estimatedDurationMinutes: test.estimatedDurationMinutes,
    publishedAt: test.publishedAt,
    modules: Array.from(new Set(test.sections.map((section) => section.module))),
    sections: test.sections.length,
  };
}

function mockTestPopulateQuery() {
  const qs = new URLSearchParams();
  qs.set("populate[sections][populate][questionGroups][populate]", "*");
  qs.set("populate[sections][populate][questions][populate]", "*");
  qs.set("sort[0]", "publishedAt:desc");
  return qs;
}

export async function fetchStrapiMockTests(type?: string): Promise<StrapiMockTestSummary[] | null> {
  const qs = mockTestPopulateQuery();
  qs.set("pagination[pageSize]", "100");
  if (type) qs.set("filters[type][$eq]", type);
  const res = await strapiFetch<StrapiListResponse>(`/api/mock-tests?${qs.toString()}`);
  if (!res) return null;
  return collection(res.data)
    .map(mockTestFromEntry)
    .filter((t): t is NormalizedMockTest => isPublishedMockTest(t))
    .map(mockTestSummary);
}

export async function fetchStrapiMockTest(id: string): Promise<NormalizedMockTest | null> {
  const documentId = documentIdFromAppId(id);
  const qs = mockTestPopulateQuery();
  const res = await strapiFetch<StrapiListResponse>(`/api/mock-tests/${documentId}?${qs.toString()}`);
  if (!res?.data) return null;
  const test = mockTestFromEntry(res.data);
  return isPublishedMockTest(test) ? test : null;
}

export async function ensureLocalTestFromStrapi(id: string) {
  if (!isStrapiId(id)) return null;

  const existing = await prisma.test.findUnique({ where: { id } });
  if (existing) return existing;

  const test = await fetchStrapiMockTest(id);
  if (!test) return null;

  return prisma.$transaction(async (tx) => {
    const created = await tx.test.create({
      data: {
        id: test.id,
        title: test.title,
        description: test.description,
        type: test.type,
        status: "published",
        estimatedDurationMinutes: test.estimatedDurationMinutes,
        publishedAt: test.publishedAt ? new Date(test.publishedAt) : new Date(),
        sections: {
          create: test.sections.map((section) => ({
            id: section.id,
            module: section.module,
            partNumber: section.partNumber,
            title: section.title,
            instructions: section.instructions,
            durationMinutes: section.durationMinutes,
            orderIndex: section.orderIndex,
            contentJson: section.contentJson,
            groups: {
              create: section.groups.map((group) => ({
                id: group.id,
                title: group.title,
                instructions: group.instructions,
                questionType: group.questionType,
                orderIndex: group.orderIndex,
                displayJson: group.displayJson,
              })),
            },
            questions: {
              create: section.questions.map((question) => ({
                id: question.id,
                groupId: question.groupId,
                questionType: question.questionType,
                prompt: question.prompt,
                optionsJson: question.optionsJson,
                orderIndex: question.orderIndex,
                difficulty: question.difficulty,
                explanation: question.explanation,
                sourceSpanJson: question.sourceSpanJson,
                answerKey: question.answerKey
                  ? {
                      create: {
                        canonicalAnswer: question.answerKey.canonicalAnswer,
                        acceptedAnswersJson: question.answerKey.acceptedAnswersJson,
                        scoringRuleJson: question.answerKey.scoringRuleJson,
                        explanation: question.answerKey.explanation,
                      },
                    }
                  : undefined,
              })),
            },
          })),
        },
      },
    });
    return created;
  });
}
