import {
  createDevSessionToken,
  getDevCredentialRole,
  getDevAuthCookieName,
  getDevAuthSeedProfile,
} from "@/lib/auth/dev-session";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api/response";
import { authRateLimiter, withRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const isDevMode = process.env.NODE_ENV !== "production";

const checkRateLimit = withRateLimit(authRateLimiter, getClientIp);
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isDevMode) {
    return fail({ code: "FORBIDDEN", message: "Dev auth is only available in development." }, 403);
  }

  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);
  if (!parsedBody.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid login data." }, 400);
  }
  const { email, password } = parsedBody.data;
  const role = getDevCredentialRole(email, password);

  if (!role) {
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

  if (role === "learner") {
    const existingDemoCredits = await prisma.creditLedger.findFirst({
      where: {
        profileId: profile.id,
        type: "promo",
        refId: "dev-auth:demo-credits",
      },
      select: { id: true },
    });

    if (!existingDemoCredits) {
      await prisma.creditLedger.create({
        data: {
          profileId: profile.id,
          amount: 5,
          type: "promo",
          description: "Dev demo credits",
          refId: "dev-auth:demo-credits",
        },
      });
    }
  }

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
    value: createDevSessionToken({ email: profile.email, name: profile.name ?? seed.name, role }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
