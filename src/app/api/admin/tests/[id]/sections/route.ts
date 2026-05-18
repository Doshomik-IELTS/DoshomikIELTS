import { prisma } from "@/lib/prisma";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";

const createSectionSchema = z.object({
  title: z.string().min(1).max(255),
  module: z.enum(["listening", "reading", "writing", "speaking"]),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  partNumber: z.number().int().min(1).optional(),
  orderIndex: z.number().int().min(0).optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  mediaAssetId: z.string().uuid().optional(),
});

const updateSectionSchema = createSectionSchema.partial();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id: testId } = await params;

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }
  const editable = await canEditTestContent(testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = createSectionSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid section data.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  const maxOrder = await prisma.testSection.findFirst({
    where: { testId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const section = await prisma.testSection.create({
    data: {
      testId,
      title: data.title,
      module: data.module,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      partNumber: data.partNumber,
      orderIndex: data.orderIndex ?? (maxOrder?.orderIndex ?? -1) + 1,
      contentJson: data.contentJson as Prisma.InputJsonValue | undefined,
      mediaAssetId: data.mediaAssetId,
    },
  });

  await logAuditEvent({
    action: "test_section.create",
    entityType: "TestSection",
    entityId: section.id,
    actorId: actor.profile.id,
    metadata: { testId, title: section.title, module: section.module },
  });

  return ok({
    id: section.id,
    title: section.title,
    module: section.module,
    partNumber: section.partNumber,
    instructions: section.instructions,
    durationMinutes: section.durationMinutes,
    orderIndex: section.orderIndex,
    questionCount: 0,
    contentJson: section.contentJson,
    mediaAssetId: section.mediaAssetId,
  }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id: testId } = await params;
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing sectionId query parameter." }, 400);
  }

  const section = await prisma.testSection.findFirst({ where: { id: sectionId, testId } });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found." }, 404);
  }
  const editable = await canEditTestContent(testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid section data.", details: parsed.error.flatten() }, 400);
  }

  const updateData: Prisma.TestSectionUpdateInput = {
    ...parsed.data,
    contentJson: parsed.data.contentJson as Prisma.InputJsonValue | undefined,
  };

  const updated = await prisma.testSection.update({
    where: { id: sectionId },
    data: updateData,
  });

  await logAuditEvent({
    action: "test_section.update",
    entityType: "TestSection",
    entityId: updated.id,
    actorId: actor.profile.id,
    metadata: { testId, title: updated.title, module: updated.module },
  });

  return ok({
    id: updated.id,
    title: updated.title,
    module: updated.module,
    partNumber: updated.partNumber,
    instructions: updated.instructions,
    durationMinutes: updated.durationMinutes,
    orderIndex: updated.orderIndex,
    contentJson: updated.contentJson,
    mediaAssetId: updated.mediaAssetId,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id: testId } = await params;
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing sectionId query parameter." }, 400);
  }

  const section = await prisma.testSection.findFirst({
    where: { id: sectionId, testId },
    include: { _count: { select: { questions: true } } },
  });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found." }, 404);
  }
  const editable = await canEditTestContent(testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  await prisma.testSection.delete({ where: { id: sectionId } });

  await logAuditEvent({
    action: "test_section.delete",
    entityType: "TestSection",
    entityId: sectionId,
    actorId: actor.profile.id,
    metadata: { testId, title: section.title, module: section.module },
  });

  return ok({ deleted: true });
}
