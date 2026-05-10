import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const { id } = await params;

  const resource = await prisma.resource.findFirst({
    where: { id, status: "published" },
  });

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Resource not found." }, 404);
  }

  await prisma.savedResource.upsert({
    where: {
      profileId_resourceId: {
        profileId: current.profile.id,
        resourceId: id,
      },
    },
    update: {},
    create: {
      profileId: current.profile.id,
      resourceId: id,
    },
  });

  return ok({ success: true });
}