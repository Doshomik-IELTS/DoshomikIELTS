import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { fetchStrapiResource, fetchStrapiResourceBySlug, isStrapiId } from "@/lib/strapi/content";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  const savedIds = current
    ? new Set(
        (
          await prisma.savedResource.findMany({
            where: { profileId: current.profile.id },
            select: { resourceId: true },
          })
        ).map((item) => item.resourceId),
      )
    : new Set<string>();

  if (isStrapiId(id)) {
    const strapiResource = await fetchStrapiResource(id);
    if (!strapiResource) {
      return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
    }
    return ok({
      resource: {
        ...strapiResource,
        saved: savedIds.has(strapiResource.id),
      },
    });
  }

  const strapiResource = await fetchStrapiResourceBySlug(id);
  if (strapiResource) {
    return ok({
      resource: {
        ...strapiResource,
        saved: savedIds.has(strapiResource.id),
      },
    });
  }

  const resource = await prisma.resource.findFirst({
    where: {
      status: "published",
      OR: [{ id }, { slug: id }],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      difficulty: true,
      body: true,
      examplesJson: true,
      tags: true,
      publishedAt: true,
    },
  });

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  return ok({
    resource: {
      ...resource,
      saved: savedIds.has(resource.id),
    },
  });
}
