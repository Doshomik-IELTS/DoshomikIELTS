import { fail, ok } from "@/lib/api/response";
import { logRouteError } from "@/lib/api/logging";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const mediaSchema = z.object({
  title: z.string().optional().nullable(),
  altText: z.string().optional().nullable(),
  transcriptText: z.string().optional().nullable(),
  bucket: z.string().min(1),
  path: z.string().min(1),
  purpose: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  licenseMetadataJson: z.record(z.string(), z.unknown()).optional().nullable(),
});

const querySchema = paginationSchema.pick({ limit: true }).extend({
  search: z.string().trim().min(1).max(120).optional(),
  purpose: z.string().trim().min(1).max(64).optional(),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  try {
    const parsedQuery = parseQuery(request, querySchema);
    if (parsedQuery.response) return parsedQuery.response;
    const { search, purpose, limit } = parsedQuery.data;

    const media = await prisma.mediaAsset.findMany({
    where: {
      ...(purpose ? { purpose } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { path: { contains: search, mode: "insensitive" } },
              { transcriptText: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      altText: true,
      transcriptText: true,
      bucket: true,
      path: true,
      purpose: true,
      contentType: true,
      sizeBytes: true,
      durationSeconds: true,
      licenseMetadataJson: true,
      createdAt: true,
    },
  });

    return ok({ media });
  } catch (error) {
    logRouteError("/api/admin/media", error, { method: "GET", actorId: adminAuth.actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = mediaSchema.safeParse(body);
    if (!parsed.success) {
      return fail({ code: "VALIDATION_ERROR", message: "Invalid media asset data.", details: parsed.error.flatten() }, 400);
    }

    const data = parsed.data;
    const media = await prisma.mediaAsset.create({
    data: {
      profileId: actor.profile.id,
      title: data.title ?? null,
      altText: data.altText ?? null,
      transcriptText: data.transcriptText ?? null,
      bucket: data.bucket,
      path: data.path,
      purpose: data.purpose,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes ?? null,
      durationSeconds: data.durationSeconds ?? null,
      licenseMetadataJson: data.licenseMetadataJson as Prisma.InputJsonValue | undefined,
    },
  });

    await logAuditEvent({
    action: "media.create",
    entityType: "MediaAsset",
    entityId: media.id,
    actorId: actor.profile.id,
    metadata: { title: media.title, purpose: media.purpose, path: media.path },
  });

    return ok({ media }, { status: 201 });
  } catch (error) {
    logRouteError("/api/admin/media", error, { method: "POST", actorId: actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}
