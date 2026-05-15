import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
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
  const search = searchParams.get("search")?.trim();
  const purpose = searchParams.get("purpose")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

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
}

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
}
