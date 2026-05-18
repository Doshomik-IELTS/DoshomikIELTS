import { fail, ok } from "@/lib/api/response";
import {
  assertCanSetResourceStatus,
  requireAdminActorOrResponse,
} from "@/lib/auth/admin-api";
import { logRouteError } from "@/lib/api/logging";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ensureUniqueResourceSlug, slugifyTitle } from "@/lib/slug";
import { adminResourcePatchSchema } from "@/lib/validators/admin-resource";
import { logAuditEvent } from "@/lib/audit";

function resourceSnapshot(resource: {
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
  createdAt?: Date;
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
    createdAt: resource.createdAt?.toISOString() ?? null,
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
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

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  return ok({ resource });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body." }, 400);
  }

  const parsed = adminResourcePatchSchema.safeParse(json);
  if (!parsed.success) {
    return fail(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid resource data.",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return fail({ code: "VALIDATION_ERROR", message: "No fields to update." }, 400);
  }

  try {
    assertCanSetResourceStatus(actor.profile.roles, data.status);
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN_PUBLISH") {
      return fail({ code: "FORBIDDEN", message: "You cannot publish resources." }, 403);
    }
    if (err instanceof Error && err.message === "FORBIDDEN_ARCHIVE") {
      return fail({ code: "FORBIDDEN", message: "Only admins can archive resources." }, 403);
    }
    throw err;
  }

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (!existing) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  if (data.status === "published") {
    const bodyToCheck = data.body ?? existing.body;
    if (!bodyToCheck?.trim()) {
      return fail(
        { code: "VALIDATION_ERROR", message: "Cannot publish without body content." },
        400,
      );
    }
  }

  let nextSlug = existing.slug;
  if (data.slug !== undefined) {
    const base = data.slug?.trim() || slugifyTitle(data.title ?? existing.title);
    nextSlug = await ensureUniqueResourceSlug(base, id);
  }

  const previousStatus = existing.status;
  const updateData: Prisma.ResourceUpdateInput = {
    ...(data.title !== undefined ? { title: data.title } : {}),
    slug: nextSlug,
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
    ...(data.body !== undefined ? { body: data.body } : {}),
    ...(data.tags !== undefined ? { tags: data.tags } : {}),
    ...(data.examplesJson !== undefined
      ? {
          examplesJson:
            data.examplesJson === null ? Prisma.JsonNull : data.examplesJson,
        }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.status === "published" && !existing.publishedAt ? { publishedAt: new Date() } : {}),
  };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.update({
        where: { id },
        data: updateData,
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
          snapshotJson: resourceSnapshot(resource) as Prisma.InputJsonValue,
          changeNote:
            data.status && data.status !== previousStatus
              ? `Status changed from ${previousStatus} to ${data.status}`
              : "Resource updated",
          createdById: actor.profile.id,
        },
      });

      return resource;
    });

    await logAuditEvent({
      action:
        data.status === "published" && previousStatus !== "published"
          ? "resource.publish"
          : data.status === "archived" && previousStatus !== "archived"
            ? "resource.archive"
            : "resource.update",
      entityType: "Resource",
      entityId: updated.id,
      actorId: actor.profile.id,
      metadata: {
        title: updated.title,
        previousStatus,
        status: updated.status,
      },
    });

    return ok({ resource: updated });
  } catch (error) {
    logRouteError("/api/admin/resources/[id]", error, { method: "PATCH", actorId: actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Could not update resource." }, 500);
  }
}
