import { fail, ok } from "@/lib/api/response";
import {
  assertCanSetResourceStatus,
  requireAdminActorOrResponse,
} from "@/lib/auth/admin-api";
import { logRouteError } from "@/lib/api/logging";
import { prisma } from "@/lib/prisma";
import { ensureUniqueResourceSlug, slugifyTitle } from "@/lib/slug";
import { logAuditEvent } from "@/lib/audit";
import {
  adminResourceCreateSchema,
  adminResourceListQuerySchema,
} from "@/lib/validators/admin-resource";

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = adminResourceListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters.",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const { status, category, difficulty, search, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return ok({
    resources,
    page,
    limit,
    total,
  });
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body." }, 400);
  }

  const parsed = adminResourceCreateSchema.safeParse(json);
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

  if (data.status === "published" && !data.body?.trim()) {
    return fail({ code: "VALIDATION_ERROR", message: "Cannot publish without body content." }, 400);
  }

  const baseSlug = data.slug?.trim() || slugifyTitle(data.title);
  const slug = await ensureUniqueResourceSlug(baseSlug);

  try {
    const created = await prisma.resource.create({
      data: {
        title: data.title,
        slug,
        category: data.category,
        difficulty: data.difficulty,
        body: data.body,
        tags: data.tags ?? [],
        examplesJson: data.examplesJson ?? undefined,
        status: data.status,
        createdById: actor.profile.id,
        publishedAt: data.status === "published" ? new Date() : undefined,
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

    await logAuditEvent({
      action: "resource.create",
      entityType: "Resource",
      entityId: created.id,
      actorId: actor.profile.id,
      metadata: { title: created.title, status: created.status },
    });

    return ok({ resource: created }, { status: 201 });
  } catch (error) {
    logRouteError("/api/admin/resources", error, { method: "POST", actorId: actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Could not create resource." }, 500);
  }
}
