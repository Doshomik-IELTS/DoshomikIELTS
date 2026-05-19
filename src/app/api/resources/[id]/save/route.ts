import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ensureLocalResourceFromStrapi,
  fetchStrapiResourceBySlug,
  isStrapiId,
} from "@/lib/strapi/content";
import { verifyCsrf } from "@/lib/security/csrf";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const csrfResponse = verifyCsrf(_request);
  if (csrfResponse) return csrfResponse;

  const { id } = await params;

  const resource = await resolveSavableResource(id);

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  await prisma.savedResource.upsert({
    where: {
      profileId_resourceId: {
        profileId: current.profile.id,
        resourceId: resource.id,
      },
    },
    update: {},
    create: {
      profileId: current.profile.id,
      resourceId: resource.id,
    },
  });

  return ok({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const csrfResponse = verifyCsrf(_request);
  if (csrfResponse) return csrfResponse;

  const { id } = await params;
  const resource = await resolveSavableResource(id);

  await prisma.savedResource.deleteMany({
    where: {
      profileId: current.profile.id,
      resourceId: resource?.id ?? id,
    },
  });

  return ok({ success: true });
}

async function resolveSavableResource(idOrSlug: string) {
  if (isStrapiId(idOrSlug)) {
    return ensureLocalResourceFromStrapi(idOrSlug);
  }

  const strapiResource = await fetchStrapiResourceBySlug(idOrSlug);
  if (strapiResource) {
    return ensureLocalResourceFromStrapi(strapiResource.id);
  }

  return prisma.resource.findFirst({
    where: {
      status: "published",
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}
