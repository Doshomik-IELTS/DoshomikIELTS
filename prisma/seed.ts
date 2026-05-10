import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.profile.upsert({
    where: { authUserId: "dev:demo" },
    update: {
      email: "demo@ieltspp.local",
      name: "Demo Learner",
      targetBand: 6.5,
      examDate: new Date("2026-12-31"),
      nativeLanguage: "Bangla",
      studyGoal: "Reach IELTS 6.5+ with strong foundations",
    },
    create: {
      authUserId: "dev:demo",
      email: "demo@ieltspp.local",
      name: "Demo Learner",
      targetBand: 6.5,
      examDate: new Date("2026-12-31"),
      nativeLanguage: "Bangla",
      studyGoal: "Reach IELTS 6.5+ with strong foundations",
      roles: { create: { role: "learner" } },
    },
    include: { roles: true },
  });

  // Local dev: same demo user can open `/admin` to exercise admin UI (not for production patterns).
  await prisma.role.createMany({
    data: [{ profileId: demo.id, role: "admin" }],
    skipDuplicates: true,
  });

  await prisma.resource.upsert({
    where: { slug: "basic-sentence-structure" },
    update: {},
    create: {
      title: "Basic Sentence Structure",
      slug: "basic-sentence-structure",
      category: "basic_english",
      difficulty: "basic",
      status: "published",
      body: "A simple English sentence usually has a subject, a verb, and often an object. Example: I study English.",
      examplesJson: [
        { label: "Subject + verb", text: "She reads." },
        { label: "Subject + verb + object", text: "She reads books." }
      ],
      tags: ["basic-english", "sentence-structure"]
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
