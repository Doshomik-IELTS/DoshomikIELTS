import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id: testId } = await params;

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    title?: string;
    module?: string;
    instructions?: string;
    durationMinutes?: number;
    orderIndex?: number;
  };

  const { title, module, instructions, durationMinutes, orderIndex } = body;

  if (!title) {
    return fail({ code: "VALIDATION_ERROR", message: "Title is required" }, 400);
  }

  const section = await prisma.testSection.create({
    data: {
      testId,
      title,
      module: (module as "listening" | "reading" | "writing" | "speaking") || "listening",
      instructions,
      durationMinutes,
      orderIndex: orderIndex ?? 0,
    },
  });

  return ok({
    id: section.id,
    title: section.title,
    module: section.module,
    orderIndex: section.orderIndex,
  }, { status: 201 });
}