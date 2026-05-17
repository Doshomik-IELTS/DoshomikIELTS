import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { fetchStrapiResource, isStrapiId } from "@/lib/strapi/content";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (isStrapiId(id)) {
    const strapiResource = await fetchStrapiResource(id);
    if (!strapiResource) {
      return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
    }
    return ok({ resource: strapiResource });
  }

  const resource = await prisma.resource.findFirst({
    where: { id, status: "published" },
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

  return ok({ resource });
}
