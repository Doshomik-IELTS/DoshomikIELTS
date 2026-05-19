import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateSchema = z.object({
  status: z.enum(["blueprint", "generating", "validating", "review", "published", "archived"]).optional(),
  outputJson: z.record(z.string(), z.unknown()).optional().nullable(),
  validationJson: z.record(z.string(), z.unknown()).optional().nullable(),
  errorJson: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;
  const job = await prisma.testGenerationJob.findUnique({ where: { id } });
  if (!job) {
    return fail({ code: "NOT_FOUND", message: "Generation job not found." }, 404);
  }

  return ok({ job });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid generation job data.", details: parsed.error.flatten() }, 400);
  }

  const job = await prisma.testGenerationJob.update({
    where: { id },
    data: {
      status: parsed.data.status,
      outputJson: parsed.data.outputJson as Prisma.InputJsonValue | undefined,
      validationJson: parsed.data.validationJson as Prisma.InputJsonValue | undefined,
      errorJson: parsed.data.errorJson as Prisma.InputJsonValue | undefined,
      reviewedById: parsed.data.status === "published" || parsed.data.status === "archived" ? actor.profile.id : undefined,
    },
  });

  return ok({ job });
}
