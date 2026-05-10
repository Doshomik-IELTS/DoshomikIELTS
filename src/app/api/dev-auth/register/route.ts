import { createDevSessionToken, getDevAuthCookieName } from "@/lib/auth/dev-session";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api/response";

const isDevMode = process.env.NODE_ENV !== "production";

export async function POST(request: Request) {
  if (!isDevMode) {
    return fail({ code: "FORBIDDEN", message: "Dev auth is only available in development." }, 403);
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; name?: string } | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";
  const name = body?.name ?? "";

  if (!email || !password || !name) {
    return fail({ code: "VALIDATION_ERROR", message: "Email, password, and name are required." }, 400);
  }

  const existingProfile = await prisma.profile.findUnique({ where: { email } });
  if (existingProfile) {
    return fail({ code: "CONFLICT", message: "An account with this email already exists." }, 409);
  }

  const profile = await prisma.profile.create({
    data: {
      email,
      name,
      authUserId: `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      roles: { create: { role: "learner" } },
    },
    include: { roles: true },
  });

  const response = ok({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    roles: profile.roles.map((role) => role.role),
  });

  response.cookies.set({
    name: getDevAuthCookieName(),
    value: createDevSessionToken({ email: profile.email, name: profile.name ?? name }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}