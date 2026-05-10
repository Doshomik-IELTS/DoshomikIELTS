import { prisma } from "@/lib/prisma";
import { getDevAuthSeedProfile, readDevSession } from "@/lib/auth/dev-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isDevAuthEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function getCurrentUser() {
  if (isDevAuthEnabled()) {
    const devSession = await readDevSession();

    if (devSession) {
      const seed = getDevAuthSeedProfile();
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
          roles: { create: { role: "learner" } },
        },
        include: { roles: true },
      });

      await prisma.role.createMany({
        data: [{ profileId: profile.id, role: "learner" }],
        skipDuplicates: true,
      });

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
