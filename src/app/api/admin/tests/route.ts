import { prisma } from "@/lib/prisma";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { ok, fail } from "@/lib/api/response";
import { logRouteError } from "@/lib/api/logging";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/audit";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const testTypeSchema = z.enum(["practice", "short_mock", "full_mock"]);
const contentStatusSchema = z.enum(["draft", "review", "published", "archived"]);

const querySchema = paginationSchema.extend({
  status: contentStatusSchema.optional(),
  type: testTypeSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

const sectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  module: z.enum(["listening", "reading", "writing", "speaking"]),
  partNumber: z.number().int().min(1).max(4).optional(),
  instructions: z.string().max(4000).optional(),
  durationMinutes: z.number().int().min(1).max(240).optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
});

const createTestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  type: testTypeSchema.optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(600).optional(),
  sections: z.array(sectionSchema).max(20).optional(),
});

const defaultDeps = {
  requireAdminActorOrResponse,
  prisma,
  logAuditEvent,
  logRouteError,
};

type AdminTestsDeps = typeof defaultDeps;

export async function getAdminTests(
  request: Request,
  deps: AdminTestsDeps = defaultDeps,
) {
  const adminAuth = await deps.requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  try {
  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { status, type, search, page, limit } = parsedQuery.data;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const skip = (page - 1) * limit;

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        estimatedDurationMinutes: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sections: true,
            attempts: true,
          },
        },
      },
    }),
    prisma.test.count({ where }),
  ]);

  const items = tests.map((test) => ({
    id: test.id,
    title: test.title,
    type: test.type,
    status: test.status,
    estimatedDurationMinutes: test.estimatedDurationMinutes,
    publishedAt: test.publishedAt,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
    sectionCount: test._count.sections,
    attemptCount: test._count.attempts,
  }));

  return ok({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
  } catch (error) {
    deps.logRouteError("/api/admin/tests", error, { method: "GET", actorId: adminAuth.actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}

export async function postAdminTest(
  request: Request,
  deps: AdminTestsDeps = defaultDeps,
) {
  const adminAuth = await deps.requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  try {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsedBody = createTestSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid test data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { title, description, type, estimatedDurationMinutes, sections } = parsedBody.data;

  const test = await deps.prisma.test.create({
    data: {
      title,
      description: description || null,
      type: type || "short_mock",
      estimatedDurationMinutes: estimatedDurationMinutes || null,
      status: "draft",
      ...(sections?.length
        ? {
            sections: {
              create: sections.map((s, idx): Prisma.TestSectionCreateWithoutTestInput => ({
                title: s.title,
                module: s.module,
                partNumber: s.partNumber ?? null,
                instructions: s.instructions ?? null,
                durationMinutes: s.durationMinutes ?? null,
                orderIndex: idx,
                contentJson: s.contentJson ? (s.contentJson as Prisma.InputJsonValue) : undefined,
              })),
            },
          }
        : {}),
    },
  });

  await deps.logAuditEvent({
    action: "test.create",
    entityType: "Test",
    entityId: test.id,
    actorId: actor.profile.id,
    metadata: { title: test.title, type: test.type },
  });

  return ok({
    id: test.id,
    title: test.title,
    description: test.description,
    type: test.type,
    status: test.status,
    createdAt: test.createdAt,
  }, { status: 201 });
  } catch (error) {
    deps.logRouteError("/api/admin/tests", error, { method: "POST", actorId: actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}

export async function GET(request: Request) {
  return getAdminTests(request);
}

export async function POST(request: Request) {
  return postAdminTest(request);
}
