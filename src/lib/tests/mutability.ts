import { prisma } from "@/lib/prisma";

export async function canEditTestContent(testId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      status: true,
      _count: { select: { attempts: true } },
    },
  });

  if (!test) return { ok: false as const, reason: "not_found" as const };
  if (test.status === "published" && test._count.attempts > 0) {
    return { ok: false as const, reason: "published_with_attempts" as const };
  }

  return { ok: true as const };
}

export function publishedMutationMessage() {
  return "Published tests with learner attempts cannot be edited. Duplicate it as a draft version instead.";
}
