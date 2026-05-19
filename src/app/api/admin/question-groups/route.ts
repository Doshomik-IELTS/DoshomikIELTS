import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";

const groupSchema = z.object({
  sectionId: z.string().uuid(),
  title: z.string().min(1).max(255),
  instructions: z.string().min(1).max(2000),
  questionType: z.string().min(1).max(120),
  orderIndex: z.number().int().min(0).optional(),
  displayJson: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");
  if (!sectionId) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing sectionId query parameter." }, 400);
  }

  const groups = await prisma.questionGroup.findMany({
    where: { sectionId },
    orderBy: { orderIndex: "asc" },
  });

  return ok({ groups });
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const body = await request.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid question group data.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const section = await prisma.testSection.findUnique({
    where: { id: data.sectionId },
    select: { testId: true },
  });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found." }, 404);
  }
  const editable = await canEditTestContent(section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const maxOrder = await prisma.questionGroup.findFirst({
    where: { sectionId: data.sectionId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const group = await prisma.questionGroup.create({
    data: {
      sectionId: data.sectionId,
      title: data.title,
      instructions: data.instructions,
      questionType: data.questionType,
      orderIndex: data.orderIndex ?? (maxOrder?.orderIndex ?? -1) + 1,
      displayJson: data.displayJson as Prisma.InputJsonValue | undefined,
    },
  });

  await logAuditEvent({
    action: "question_group.create",
    entityType: "QuestionGroup",
    entityId: group.id,
    actorId: actor.profile.id,
    metadata: { sectionId: group.sectionId, title: group.title },
  });

  return ok({ group }, { status: 201 });
}
