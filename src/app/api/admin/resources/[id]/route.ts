import { fail, ok } from "@/lib/api/response";
import { assertCanSetResourceStatus, requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ensureUniqueResourceSlug, slugifyTitle } from "@/lib/slug";
import { adminResourcePatchSchema } from "@/lib/validators/admin-resource";

function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return fail({ code: "FORBIDDEN", message: "Admin access required." }, 403);
  }
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminActor();
  } catch (error) {
    const r = adminErrorResponse(error);
    if (r) return r;
    throw error;
  }

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
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    const r = adminErrorResponse(error);
    if (r) return r;
    throw error;
  }

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

  try {
    const updated = await prisma.resource.update({
      where: { id },
      data: {
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
        updatedAt: true,
      },
    });

    return ok({ resource: updated });
  } catch {
    return fail({ code: "INTERNAL_ERROR", message: "Could not update resource." }, 500);
  }
}
