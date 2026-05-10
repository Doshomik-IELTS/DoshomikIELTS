import type { Profile, Role } from "@prisma/client";

/** `GET /api/me` success payload (JSON-serializable). */
export type MeResponse = {
  id: string;
  email: string;
  name: string | null;
  targetBand: number | null;
  examDate: string | null;
  nativeLanguage: string | null;
  studyGoal: string | null;
  roles: string[];
};

export function profileToMeResponse(profile: Profile & { roles: Role[] }): MeResponse {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    targetBand: profile.targetBand,
    examDate: profile.examDate ? profile.examDate.toISOString() : null,
    nativeLanguage: profile.nativeLanguage,
    studyGoal: profile.studyGoal,
    roles: profile.roles.map((r) => r.role),
  };
}
