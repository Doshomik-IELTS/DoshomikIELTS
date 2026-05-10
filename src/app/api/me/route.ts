import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const current = await getCurrentUser();

  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const { profile } = current;
  return ok({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    targetBand: profile.targetBand,
    examDate: profile.examDate,
    nativeLanguage: profile.nativeLanguage,
    studyGoal: profile.studyGoal,
    roles: profile.roles.map((role) => role.role),
  });
}
