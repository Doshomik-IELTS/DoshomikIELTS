import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const mediaPatchSchema = z.object({
  title: z.string().optional().nullable(),
  altText: z.string().optional().nullable(),
  transcriptText: z.string().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  licenseMetadataJson: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const body = await request.json().catch(() => null);
  const parsed = mediaPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid media asset data.", details: parsed.error.flatten() }, 400);
  }

  const media = await prisma.mediaAsset.update({
    where: { id },
    data: {
      title: parsed.data.title,
      altText: parsed.data.altText,
      transcriptText: parsed.data.transcriptText,
      durationSeconds: parsed.data.durationSeconds,
      licenseMetadataJson: parsed.data.licenseMetadataJson as Prisma.InputJsonValue | undefined,
    },
  });

  await logAuditEvent({
    action: "media.update",
    entityType: "MediaAsset",
    entityId: media.id,
    actorId: actor.profile.id,
    metadata: { title: media.title, purpose: media.purpose },
  });

  return ok({ media });
}
