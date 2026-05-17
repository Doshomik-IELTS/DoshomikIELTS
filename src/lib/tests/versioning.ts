import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function createTestVersionSnapshot({
  testId,
  actorId,
  changeNote,
}: {
  testId: string;
  actorId?: string;
  changeNote?: string;
}) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          groups: { orderBy: { orderIndex: "asc" } },
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answerKey: true },
          },
        },
      },
    },
  });

  if (!test) return null;

  return prisma.testVersion.upsert({
    where: {
      testId_versionNumber: {
        testId,
        versionNumber: test.versionNumber,
      },
    },
    create: {
      testId,
      versionNumber: test.versionNumber,
      snapshotJson: structuredClone(test) as Prisma.InputJsonValue,
      changeNote,
      createdById: actorId,
    },
    update: {
      snapshotJson: structuredClone(test) as Prisma.InputJsonValue,
      changeNote,
      createdById: actorId,
    },
  });
}
