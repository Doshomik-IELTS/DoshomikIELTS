import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildLocalGeneratedTest } from "@/lib/tests/local-generation";
import type { Prisma } from "@prisma/client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id } = await params;
  const job = await prisma.testGenerationJob.findUnique({ where: { id } });
  if (!job) {
    return fail({ code: "NOT_FOUND", message: "Generation job not found." }, 404);
  }

  const outputJson = buildLocalGeneratedTest(job);
  const updated = await prisma.testGenerationJob.update({
    where: { id },
    data: {
      status: "review",
      provider: "local-deterministic",
      model: "local-draft-generator",
      promptVersion: "cms-local-v1",
      outputJson: outputJson as Prisma.InputJsonValue,
      validationJson: {
        valid: true,
        note: "Local draft output is structurally importable but still requires human content review.",
      },
    },
  });

  await logAuditEvent({
    action: "generation.local_draft",
    entityType: "TestGenerationJob",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { module: job.module, testType: job.testType },
  });

  return ok({ job: updated });
}
