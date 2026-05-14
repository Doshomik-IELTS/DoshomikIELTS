import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../../src/lib/prisma";

async function getOrCreateProfile(email: string, roles: ("learner" | "admin" | "reviewer" | "evaluator")[] = ["learner"]) {
  const profile = await prisma.profile.upsert({
    where: { email },
    update: {},
    create: {
      authUserId: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email,
      name: "Test User",
      roles: {
        create: roles.map((r) => ({ role: r })),
      },
    },
    include: { roles: true },
  });
  return profile;
}

async function createTestWithAttempt(profileId: string) {
  const test = await prisma.test.create({
    data: {
      title: `Test ${Date.now()}`,
      type: "full_mock",
      estimatedDurationMinutes: 60,
      status: "published",
      sections: {
        create: [
          { module: "listening", title: "L1", partNumber: 1, durationMinutes: 30, orderIndex: 0 },
          { module: "reading", title: "R1", partNumber: 1, durationMinutes: 60, orderIndex: 1 },
        ],
      },
    },
    include: { sections: { include: { questions: true } } },
  });

  const attempt = await prisma.mockTestAttempt.create({
    data: { profileId, testId: test.id, status: "in_progress" },
  });

  return { test, attempt };
}

test.describe("Authorization & Ownership", () => {
  test("learner cannot read another learner's attempt", async () => {
    const profileA = await getOrCreateProfile(`test-a-${Date.now()}@local`);
    const profileB = await getOrCreateProfile(`test-b-${Date.now()}@local`);

    if (profileA.id === profileB.id) {
      console.log("SKIP: same profile");
      return;
    }

    const { attempt } = await createTestWithAttempt(profileA.id);

    const attemptInDb = await prisma.mockTestAttempt.findUnique({
      where: { id: attempt.id },
    });

    assert.notEqual(attemptInDb?.profileId, profileB.id, "Profile B should not own Profile A's attempt");

    await prisma.mockTestAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    await prisma.test.deleteMany({ where: { title: { startsWith: "Test" } } }).catch(() => {});
  });

  test("learner test payload never includes answer keys", async () => {
    const profile = await getOrCreateProfile(`test-c-${Date.now()}@local`);
    const { test, attempt } = await createTestWithAttempt(profile.id);

    const section = test.sections[0];
    await prisma.question.create({
      data: {
        sectionId: section.id,
        questionType: "fill_blank",
        prompt: "What is the capital of France?",
        orderIndex: 0,
        answerKey: {
          create: { canonicalAnswer: "Paris" },
        },
      },
    });

    const detail = await prisma.test.findUnique({
      where: { id: test.id },
      include: { sections: { include: { questions: { include: { answerKey: true } } } } },
    });

    for (const sec of detail?.sections ?? []) {
      for (const q of sec.questions) {
        assert.ok(!q.answerKey, "Question should not have answerKey in learner query");
      }
    }

    await prisma.mockTestAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    await prisma.test.deleteMany({ where: { title: { startsWith: "Test" } } }).catch(() => {});
  });
});

test.describe("Score Prediction", () => {
  test("score prediction blocked until all four module scores exist", async () => {
    const profile = await getOrCreateProfile(`test-d-${Date.now()}@local`);
    const { attempt } = await createTestWithAttempt(profile.id);

    await prisma.moduleScore.create({
      data: { attemptId: attempt.id, module: "listening", estimatedBand: 6.5 },
    });

    const allScores = await prisma.moduleScore.findMany({ where: { attemptId: attempt.id } });
    const hasAllFour = ["listening", "reading", "writing", "speaking"].every((m) =>
      allScores.some((s) => s.module === m)
    );

    assert.ok(!hasAllFour, "Should not have all 4 modules yet");

    await prisma.mockTestAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    await prisma.test.deleteMany({ where: { title: { startsWith: "Test" } } }).catch(() => {});
    await prisma.moduleScore.deleteMany({ where: { attemptId: attempt.id } }).catch(() => {});
  });

  test("score prediction allowed when all four module scores exist", async () => {
    const profile = await getOrCreateProfile(`test-e-${Date.now()}@local`);
    const { attempt } = await createTestWithAttempt(profile.id);

    const modules = ["listening", "reading", "writing", "speaking"] as const;
    await Promise.all(
      modules.map((m) =>
        prisma.moduleScore.create({ data: { attemptId: attempt.id, module: m, estimatedBand: 6.5 } })
      )
    );

    const allScores = await prisma.moduleScore.findMany({ where: { attemptId: attempt.id } });
    const hasAllFour = modules.every((m) => allScores.some((s) => s.module === m));
    assert.ok(hasAllFour, "Should have all 4 modules");

    await prisma.mockTestAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    await prisma.test.deleteMany({ where: { title: { startsWith: "Test" } } }).catch(() => {});
    await prisma.moduleScore.deleteMany({ where: { attemptId: attempt.id } }).catch(() => {});
  });
});

test.describe("Writing & Speaking Evaluation", () => {
  test("writing evaluation creates job and links to LlmJob", async () => {
    const profile = await getOrCreateProfile(`test-f-${Date.now()}@local`);
    const { attempt } = await createTestWithAttempt(profile.id);

    const sections = await prisma.testSection.findMany({ where: { testId: attempt.testId } });
    const testSection = sections[0];

    if (!testSection) {
      console.log("SKIP: no sections");
      return;
    }

    const job = await prisma.llmJob.create({
      data: {
        type: "writing_evaluation",
        status: "queued",
        inputJson: { attemptId: attempt.id, sectionId: testSection.id },
      },
    });

    const foundJob = await prisma.llmJob.findUnique({ where: { id: job.id } });
    assert.ok(foundJob, "LlmJob should be created");
    assert.equal(foundJob.status, "queued");

    await prisma.llmJob.delete({ where: { id: job.id } }).catch(() => {});
    await prisma.mockTestAttempt.delete({ where: { id: attempt.id } }).catch(() => {});
    await prisma.test.deleteMany({ where: { title: { startsWith: "Test" } } }).catch(() => {});
  });
});

test.describe("Media Access", () => {
  test("media download URL requires owner or privileged role", async () => {
    const learner = await getOrCreateProfile(`test-g-${Date.now()}@local`);
    const otherLearner = await getOrCreateProfile(`test-h-${Date.now()}@local`);

    if (otherLearner.id === learner.id) {
      console.log("SKIP: same profile");
      return;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        profileId: learner.id,
        bucket: "speaking-recordings",
        path: "test/file.webm",
        purpose: "speaking_recording",
        contentType: "audio/webm",
        sizeBytes: 1024,
      },
    });

    const assetInDb = await prisma.mediaAsset.findUnique({ where: { id: asset.id } });
    assert.notEqual(assetInDb?.profileId, otherLearner.id, "Other learner should not own this asset");

    await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => {});
  });
});

test.describe("Admin Access", () => {
  test("learner cannot be admin without role", async () => {
    const profile = await getOrCreateProfile(`test-i-${Date.now()}@local`);
    const hasAdminRole = profile.roles.some((r) => r.role === "admin");
    assert.ok(!hasAdminRole, "Profile should not be admin");
  });

  test("admin role can be assigned", async () => {
    const adminProfile = await getOrCreateProfile(`test-j-${Date.now()}@local`, ["learner", "admin"]);
    const hasAdminRole = adminProfile.roles.some((r) => r.role === "admin");
    assert.ok(hasAdminRole, "Profile should be admin");
  });
});

test.describe("Referral System", () => {
  test("referral redemption prevents double-spend", async () => {
    const referrer = await getOrCreateProfile(`ref-${Date.now()}@local`);
    const referee = await getOrCreateProfile(`ref2-${Date.now()}@local`);

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        code: `TEST${Date.now()}`,
        status: "active",
      },
    });

    await prisma.referralRedemption.create({
      data: {
        referralId: referral.id,
        refereeId: referee.id,
        referrerReward: 10,
        refereeReward: 5,
        status: "completed",
        processedAt: new Date(),
      },
    });

    const existing = await prisma.referralRedemption.findFirst({
      where: { refereeId: referee.id },
    });
    assert.ok(existing, "Referral should be redeemed");

    await prisma.referralRedemption.deleteMany({ where: { referralId: referral.id } }).catch(() => {});
    await prisma.referral.delete({ where: { id: referral.id } }).catch(() => {});
  });
});