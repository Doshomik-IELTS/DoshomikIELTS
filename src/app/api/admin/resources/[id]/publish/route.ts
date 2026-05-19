import { fail, ok } from "@/lib/api/response";
import { canPublishResource, requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { logRouteError } from "@/lib/api/logging";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function snapshot(resource: {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  body: string;
  tags: string[];
  examplesJson: Prisma.JsonValue | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    category: resource.category,
    difficulty: resource.difficulty,
    body: resource.body,
    tags: resource.tags,
    examplesJson: resource.examplesJson,
    status: resource.status,
    publishedAt: resource.publishedAt?.toISOString() ?? null,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(_request);
  if (csrfResponse) return csrfResponse;

  if (!canPublishResource(actor.profile.roles)) {
    return fail({ code: "FORBIDDEN", message: "You cannot publish resources." }, 403);
  }

  const { id } = await params;
  const existing = await prisma.resource.findUnique({ where: { id } });

  if (!existing) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  if (!existing.body.trim()) {
    return fail({ code: "VALIDATION_ERROR", message: "Cannot publish without body content." }, 400);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.update({
        where: { id },
        data: {
          status: "published",
          publishedAt: existing.publishedAt ?? new Date(),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          difficulty: true,
          body: true,
          tags: true,
          examplesJson: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const latest = await tx.resourceVersion.findFirst({
        where: { resourceId: id },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      await tx.resourceVersion.create({
        data: {
          resourceId: id,
          versionNumber: (latest?.versionNumber ?? 0) + 1,
          snapshotJson: snapshot(resource) as Prisma.InputJsonValue,
          changeNote:
            existing.status === "published"
              ? "Resource republished"
              : `Status changed from ${existing.status} to published`,
          createdById: actor.profile.id,
        },
      });

      return resource;
    });

    await logAuditEvent({
      action: "resource.publish",
      entityType: "Resource",
      entityId: updated.id,
      actorId: actor.profile.id,
      metadata: {
        title: updated.title,
        previousStatus: existing.status,
        status: updated.status,
      },
    });

    return ok({ resource: updated });
  } catch (error) {
    logRouteError("/api/admin/resources/[id]/publish", error, {
      method: "POST",
      actorId: actor.profile.id,
    });
    return fail({ code: "INTERNAL_ERROR", message: "Could not publish resource." }, 500);
  }
}
