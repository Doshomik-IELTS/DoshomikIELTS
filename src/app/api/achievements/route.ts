import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const profileId = actor.profile.id;

  const [profile, earnedAchievements] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { streak: true, longestStreak: true, lastStudyDate: true },
    }),
    prisma.profileAchievement.findMany({
      where: { profileId },
      include: { achievement: true },
    }),
  ]);

  if (!profile) {
    return fail({ code: "NOT_FOUND", message: "Profile not found" }, 404);
  }

  const earnedMap = new Set(earnedAchievements.map((pa) => pa.achievement.slug));

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "asc" },
  });

  const badges = allAchievements.map((a) => {
    const earned = earnedAchievements.find((pa) => pa.achievementId === a.id);
    return {
      id: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      earnedAt: earned?.earnedAt.toISOString() ?? null,
    };
  });

  if (badges.length === 0) {
    const defaultBadges = [
      { id: "first-steps", name: "First Steps", description: "Complete your first practice session", icon: "📚" },
      { id: "seven-day-streak", name: "7-Day Streak", description: "Study 7 days in a row", icon: "🔥" },
      { id: "vocabulary-master", name: "Vocabulary Master", description: "Study 100+ flashcards", icon: "📖" },
      { id: "writing-pro", name: "Writing Pro", description: "Submit 5 writing tasks", icon: "✍️" },
      { id: "speaking-star", name: "Speaking Star", description: "Complete 5 speaking practice sessions", icon: "🎤" },
      { id: "mock-champion", name: "Mock Test Champion", description: "Complete a full mock test", icon: "🏆" },
      { id: "early-bird", name: "Early Bird", description: "Study before 7 AM", icon: "🌅" },
      { id: "night-owl", name: "Night Owl", description: "Study after 11 PM", icon: "🦉" },
    ];
    return ok({
      streak: profile.streak,
      longestStreak: profile.longestStreak,
      badges: defaultBadges.map((b) => ({ ...b, earnedAt: null })),
    });
  }

  return ok({
    streak: profile.streak,
    longestStreak: profile.longestStreak,
    badges,
  });
}
