import { fail, ok } from "@/lib/api/response";
import { logRouteError } from "@/lib/api/logging";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators/profile";

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireCurrentUser();
    const json = await request.json();
    const parsed = profileUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return fail(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid profile data.",
          details: parsed.error.flatten(),
        },
        400,
      );
    }

    const { examDate: examDateRaw, ...rest } = parsed.data;
    const examDate =
      examDateRaw === undefined
        ? undefined
        : examDateRaw === null || examDateRaw === ""
          ? null
          : new Date(examDateRaw);

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...rest,
        ...(examDate !== undefined ? { examDate } : {}),
      },
      include: { roles: true },
    });

    return ok({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      targetBand: updated.targetBand,
      examDate: updated.examDate,
      nativeLanguage: updated.nativeLanguage,
      studyGoal: updated.studyGoal,
      roles: updated.roles.map((role) => role.role),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
    }

    logRouteError("/api/profile", error, { method: "PATCH" });
    return fail({ code: "INTERNAL_ERROR", message: "Could not update profile." }, 500);
  }
}
