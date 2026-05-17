import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  tags: string[];
  createdAt: string | null;
  saved?: boolean;
};

export type StrapiResourceDetail = StrapiResourceSummary & {
  body: string;
  examplesJson: unknown;
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

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return value as Prisma.InputJsonValue;
}

function tagsValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string");
}

async function strapiFetch<T>(path: string): Promise<T | null> {
  if (!strapiEnabled()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${strapiBaseUrl()}${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
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
    body: stringValue(r.body),
    examplesJson: componentCollection(r.examples),
    tags: tagsValue(r.tags),
    createdAt: stringValue(r.createdAt, null as never),
    publishedAt: stringValue(r.publishedAt, null as never),
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
    .filter((r): r is StrapiResourceDetail => Boolean(r))
    .map((resource): StrapiResourceSummary => ({
      id: resource.id,
      strapiDocumentId: resource.strapiDocumentId,
      title: resource.title,
      slug: resource.slug,
      category: resource.category,
      difficulty: resource.difficulty,
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
  return resourceFromEntry(res.data);
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
    displayJson: jsonValue(g.displayConfig),
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

  return {
    id: appId(`question_${documentId}`),
    groupId: knownGroupId,
    questionType: stringValue(q.questionType, "short_answer"),
    prompt: stringValue(q.prompt),
    optionsJson: jsonValue(componentCollection(q.options)),
    orderIndex: numberValue(q.orderIndex) ?? 0,
    difficulty: stringValue(q.difficulty, "basic") as NormalizedQuestion["difficulty"],
    explanation: stringValue(q.explanation, null as never),
    sourceSpanJson: jsonValue(q.sourceSpan),
    answerKey: canonicalAnswer
      ? {
          canonicalAnswer,
          acceptedAnswersJson: jsonValue(answerKey.acceptedAnswers),
          scoringRuleJson: jsonValue(answerKey.scoringRule),
          explanation: stringValue(answerKey.explanation, null as never),
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
    module: stringValue(s.module, "reading") as NormalizedSection["module"],
    partNumber: numberValue(s.partNumber),
    title: stringValue(s.title, "Section"),
    instructions: stringValue(s.instructions, null as never),
    durationMinutes: numberValue(s.durationMinutes),
    orderIndex: numberValue(s.orderIndex) ?? 0,
    contentJson: jsonValue(s.content),
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
    description: stringValue(t.description, null as never),
    type: stringValue(t.type, "short_mock") as NormalizedMockTest["type"],
    estimatedDurationMinutes: numberValue(t.estimatedDurationMinutes),
    publishedAt: stringValue(t.publishedAt, null as never),
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
    .filter((t): t is NormalizedMockTest => Boolean(t))
    .map(mockTestSummary);
}

export async function fetchStrapiMockTest(id: string): Promise<NormalizedMockTest | null> {
  const documentId = documentIdFromAppId(id);
  const qs = mockTestPopulateQuery();
  const res = await strapiFetch<StrapiListResponse>(`/api/mock-tests/${documentId}?${qs.toString()}`);
  if (!res?.data) return null;
  return mockTestFromEntry(res.data);
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
