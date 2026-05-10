import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id } = await params;

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    return fail({ code: "NOT_FOUND", message: "Question not found" }, 404);
  }

  await prisma.question.delete({ where: { id } });

  return ok({ deleted: true });
}