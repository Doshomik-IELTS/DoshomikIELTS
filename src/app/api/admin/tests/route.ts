import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";
import { logAuditEvent } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

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
}

type SectionInput = {
  title: string;
  module: "listening" | "reading" | "writing" | "speaking";
  partNumber?: number;
  instructions?: string;
  durationMinutes?: number;
  contentJson?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    title?: string;
    description?: string | null;
    type?: string;
    estimatedDurationMinutes?: number;
    sections?: SectionInput[];
  };
  const { title, description, type, estimatedDurationMinutes, sections } = body;

  if (!title) {
    return fail({ code: "VALIDATION_ERROR", message: "Title is required" }, 400);
  }

  const test = await prisma.test.create({
    data: {
      title,
      description: description || null,
      type: (type as "practice" | "short_mock" | "full_mock") || "short_mock",
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

  await logAuditEvent({
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
}
