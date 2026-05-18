import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const generationRequestSchema = z.object({
  module: z.enum(["listening", "reading", "writing", "speaking"]),
  testType: z.enum(["practice", "short_mock", "full_mock"]).default("short_mock"),
  blueprintJson: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const body = await request.json().catch(() => null);
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid generation request.", details: parsed.error.flatten() }, 400);
  }

  const job = await prisma.testGenerationJob.create({
    data: {
      module: parsed.data.module,
      testType: parsed.data.testType,
      status: "blueprint",
      blueprintJson: parsed.data.blueprintJson as Prisma.InputJsonValue | undefined,
      createdById: actor.profile.id,
    },
  });

  return ok({ job }, { status: 201 });
}
