import { prisma } from "@/lib/prisma";
import { getDevAuthSeedProfile, readDevSession } from "@/lib/auth/dev-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEV_ADMIN_AUTH } from "@/config/dev-auth";

function isDevAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

async function getOrCreateDevProfile(role: "learner" | "admin") {
  const seed = getDevAuthSeedProfile(role);
  const existing = await prisma.profile.findUnique({
    where: { authUserId: seed.authUserId },
    include: { roles: true },
  });

  if (existing) {
    if (!existing.roles.some((r) => r.role === role)) {
      await prisma.role.createMany({
        data: [{ profileId: existing.id, role }],
        skipDuplicates: true,
      });

      return prisma.profile.findUniqueOrThrow({
        where: { id: existing.id },
        include: { roles: true },
      });
    }

    return existing;
  }

  return prisma.profile.create({
    data: {
      ...seed,
      roles: { create: { role } },
    },
    include: { roles: true },
  });
}

export async function getCurrentUser() {
  if (isDevAuthEnabled()) {
    const devSession = await readDevSession();

    if (devSession) {
      const role =
        devSession.role ??
        (devSession.email.trim().toLowerCase() === DEV_ADMIN_AUTH.email ? "admin" : "learner");
      const seed = getDevAuthSeedProfile(role);
      const profile = await getOrCreateDevProfile(role);

      return {
        user: {
          id: seed.authUserId,
          email: seed.email,
        },
        profile,
      };
    }

    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const profile = await prisma.profile.upsert({
    where: { authUserId: user.id },
    update: { email: user.email },
    create: {
      authUserId: user.id,
      email: user.email,
      roles: { create: { role: "learner" } },
    },
    include: { roles: true },
  });

  return { user, profile };
}

export async function requireCurrentUser() {
  const current = await getCurrentUser();
  if (!current) {
    throw new Error("UNAUTHENTICATED");
  }
  return current;
}
