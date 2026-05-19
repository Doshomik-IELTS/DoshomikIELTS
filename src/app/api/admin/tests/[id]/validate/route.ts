import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { validateTestForPublish } from "@/lib/tests/validation";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answerKey: true },
          },
        },
      },
    },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  return ok(validateTestForPublish(test));
}
