import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
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
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

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
