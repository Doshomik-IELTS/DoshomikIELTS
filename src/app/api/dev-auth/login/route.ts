import {
  createDevSessionToken,
  devCredentialsMatch,
  getDevAuthCookieName,
  getDevAuthSeedProfile,
} from "@/lib/auth/dev-session";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api/response";

const isDevMode = process.env.NODE_ENV !== "production";

export async function POST(request: Request) {
  if (!isDevMode) {
    return fail({ code: "FORBIDDEN", message: "Dev auth is only available in development." }, 403);
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    role?: string;
  } | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";
  const role = body?.role === "admin" ? "admin" : "learner";

  if (!devCredentialsMatch(email, password)) {
    return fail({ code: "UNAUTHENTICATED", message: "Invalid demo credentials." }, 401);
  }

  const seed = getDevAuthSeedProfile(role);
  const profile = await prisma.profile.upsert({
    where: { authUserId: seed.authUserId },
    update: {
      email: seed.email,
      name: seed.name,
      targetBand: seed.targetBand,
      examDate: seed.examDate,
      nativeLanguage: seed.nativeLanguage,
      studyGoal: seed.studyGoal,
    },
    create: {
      ...seed,
      roles: {
        create: { role: role },
      },
    },
    include: { roles: true },
  });

  await prisma.role.upsert({
    where: { profileId_role: { profileId: profile.id, role } },
    update: {},
    create: { profileId: profile.id, role },
  });

  const response = ok({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    targetBand: profile.targetBand,
    examDate: profile.examDate,
    nativeLanguage: profile.nativeLanguage,
    studyGoal: profile.studyGoal,
    roles: profile.roles.map((r) => r.role),
    role,
    demoCredentials: {
      email: email,
    },
  });

  response.cookies.set({
    name: getDevAuthCookieName(),
    value: createDevSessionToken({ email: profile.email, name: profile.name ?? seed.name }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
