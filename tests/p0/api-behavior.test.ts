import assert from "node:assert/strict";
import test from "node:test";
import { fail } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getHealth } from "@/app/api/health/route";
import { getAdminTests } from "@/app/api/admin/tests/route";
import { postAttemptAnswers } from "@/app/api/attempts/[attemptId]/answers/route";
import { postSubmitSection } from "@/app/api/attempts/[attemptId]/submit-section/route";
import { postMediaUpload } from "@/app/api/media/upload-url/route";
import { postSpeakingEvaluation } from "@/app/api/evaluations/speaking/route";
import { postWritingEvaluation } from "@/app/api/evaluations/writing/route";

type CurrentActor = Awaited<ReturnType<typeof requireCurrentUser>>;

const learnerActor = {
  user: { id: "user_1", email: "learner@example.com" },
  profile: { id: "profile_1", roles: [{ role: "learner" as const }] },
} as unknown as CurrentActor;

const adminActor = {
  user: { id: "user_admin", email: "admin@example.com" },
  profile: { id: "profile_admin", roles: [{ role: "admin" as const }] },
} as unknown as CurrentActor;

test("writing evaluation returns 401 when authentication fails", async () => {
  const response = await postWritingEvaluation(
    new Request("http://localhost/api/evaluations/writing", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_1",
        taskType: "task_1",
        responseText: "Answer text",
      }),
    }),
    {
      requireCurrentUser: async () => {
        throw new Error("UNAUTHENTICATED");
      },
      checkRateLimitForIdentifier: async () => null,
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {} as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.error.code, "UNAUTHENTICATED");
});

test("writing evaluation returns rate-limit response before touching the database", async () => {
  let touchedDatabase = false;

  const response = await postWritingEvaluation(
    new Request("http://localhost/api/evaluations/writing", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_1",
        taskType: "task_1",
        responseText: "Answer text",
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () =>
        fail({ code: "RATE_LIMITED", message: "Too many requests." }, 429),
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {
        mockTestAttempt: {
          findUnique: async () => {
            touchedDatabase = true;
            return null;
          },
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 429);
  assert.equal(touchedDatabase, false);
});

test("writing evaluation success returns created envelope", async () => {
  const createdAt = new Date("2026-05-18T00:00:00.000Z");
  let enqueuedJobId = "";

  const response = await postWritingEvaluation(
    new Request("http://localhost/api/evaluations/writing", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_1",
        taskType: "task_2",
        responseText: "This is a valid essay response.",
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date(),
            test: {
              type: "section_practice",
              sections: [{ id: "section_1", module: "writing", durationMinutes: null }],
            },
            answers: [],
          }),
          update: async () => ({ id: "attempt_1", status: "evaluating" }),
        },
        $transaction: async (callback: (tx: {
          writingEvaluation: {
            create: (args: { data: { profileId: string; attemptId: string; sectionId: string; taskType: string; responseText: string; wordCount: number; status: string } }) => Promise<{ id: string; createdAt: Date }>;
            update: (args: { where: { id: string }; data: { llmJobId: string } }) => Promise<{ id: string; createdAt: Date; status: string }>;
          };
          llmJob: {
            create: (args: { data: { type: string; status: string; inputJson: Record<string, unknown> } }) => Promise<{ id: string; type: string }>;
          };
          attemptAnswer: {
            upsert: (args: { where: { id: string }; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<{ id: string }>;
          };
        }) => Promise<{ evaluation: { id: string; createdAt: Date; status: string }; job: { id: string; type: string } }>) =>
          callback({
            writingEvaluation: {
              create: async () => ({ id: "eval_1", createdAt }),
              update: async () => ({ id: "eval_1", createdAt, status: "queued" }),
            },
            llmJob: {
              create: async () => ({ id: "job_1", type: "writing_evaluation" }),
            },
            attemptAnswer: {
              upsert: async () => ({ id: "marker_1" }),
            },
          }),
      } as never,
      enqueueLlmJob: async (_type, jobId) => {
        enqueuedJobId = jobId;
        return true;
      },
    },
  );

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.data.id, "eval_1");
  assert.equal(payload.data.status, "queued");
  assert.equal(enqueuedJobId, "job_1");
});

test("speaking evaluation validates request shape", async () => {
  const response = await postSpeakingEvaluation(
    new Request("http://localhost/api/evaluations/speaking", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_1",
        part: "part_2",
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {} as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("media upload forbids learner listening-audio uploads", async () => {
  const response = await postMediaUpload(
    new Request("http://localhost/api/media/upload-url", {
      method: "POST",
      body: JSON.stringify({
        purpose: "listening_audio",
        contentType: "audio/mpeg",
        sizeBytes: 2048,
        licenseMetadata: { source: "licensed" },
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      mediaRateLimiter: async () => ({ allowed: true, remaining: 20, resetIn: 60 }),
      createSupabaseServiceClient: (() => ({
        storage: {
          from: () => ({
            createSignedUploadUrl: async () => ({
              data: { signedUrl: "https://example.com/upload", token: "token", path: "path" },
              error: null,
            }),
          }),
        },
      })) as never,
      supabaseCircuitBreaker: {
        execute: async <T>(operation: () => Promise<T>) => operation(),
      } as never,
      prisma: { mediaAsset: { create: async () => ({ id: "media_1" }) } } as never,
    },
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error.code, "FORBIDDEN");
});

test("media upload rejects unsupported speaking audio types before storage calls", async () => {
  let touchedStorage = false;

  const response = await postMediaUpload(
    new Request("http://localhost/api/media/upload-url", {
      method: "POST",
      body: JSON.stringify({
        purpose: "speaking_recording",
        contentType: "image/png",
        sizeBytes: 2048,
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      mediaRateLimiter: async () => ({ allowed: true, remaining: 20, resetIn: 60 }),
      createSupabaseServiceClient: (() => ({
        storage: {
          from: () => {
            touchedStorage = true;
            return {
              createSignedUploadUrl: async () => ({
                data: { signedUrl: "https://example.com/upload", token: "token", path: "path" },
                error: null,
              }),
            };
          },
        },
      })) as never,
      supabaseCircuitBreaker: {
        execute: async <T>(operation: () => Promise<T>) => operation(),
      } as never,
      prisma: { mediaAsset: { create: async () => ({ id: "media_1" }) } } as never,
    },
  );

  assert.equal(response.status, 400);
  assert.equal(touchedStorage, false);
  const payload = await response.json();
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("attempt answers rejects invalid request payload", async () => {
  const response = await postAttemptAnswers(
    new Request("http://localhost/api/attempts/attempt_1/answers", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_1", answers: {} }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            testId: "test_1",
          }),
        },
      } as never,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("attempt answers returns not found for attempts owned by another profile", async () => {
  const response = await postAttemptAnswers(
    new Request("http://localhost/api/attempts/attempt_1/answers", {
      method: "POST",
      body: JSON.stringify({
        sectionId: "section_1",
        answers: { q1: "Answer" },
      }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: "another_profile",
            status: "in_progress",
            testId: "test_1",
          }),
        },
      } as never,
    },
  );

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.error.code, "NOT_FOUND");
});

test("attempt answers stores writing responses as section markers", async () => {
  let markerCreate: { answerJson: Record<string, unknown>; questionId: string | null } | null = null;

  const response = await postAttemptAnswers(
    new Request("http://localhost/api/attempts/attempt_1/answers", {
      method: "POST",
      body: JSON.stringify({
        sectionId: "section_1",
        answers: { writing: "This is a complete writing response." },
        isDraft: true,
      }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            testId: "test_1",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [{ id: "section_1", module: "writing", durationMinutes: 20 }],
            },
            answers: [],
          }),
        },
        testSection: {
          findUnique: async () => ({
            id: "section_1",
            testId: "test_1",
            module: "writing",
            questions: [],
          }),
        },
        attemptAnswer: {
          upsert: async (args: { create: { answerJson: Record<string, unknown>; questionId: string | null } }) => {
            markerCreate = args.create;
            return {};
          },
        },
      } as never,
    },
  );

  assert.equal(response.status, 200);
  const createdMarker = markerCreate as { questionId: string | null; answerJson: Record<string, unknown> } | null;
  assert.ok(createdMarker);
  assert.equal(createdMarker.questionId, null);
  assert.equal(createdMarker.answerJson.responseKind, "writing");
  assert.equal(createdMarker.answerJson.isDraft, true);
});

test("attempt answers rejects future full mock sections", async () => {
  const response = await postAttemptAnswers(
    new Request("http://localhost/api/attempts/attempt_1/answers", {
      method: "POST",
      body: JSON.stringify({
        sectionId: "section_2",
        answers: { q2: "A" },
        isDraft: true,
      }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            testId: "test_1",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [
                { id: "section_1", module: "reading", durationMinutes: 10 },
                { id: "section_2", module: "reading", durationMinutes: 10 },
              ],
            },
            answers: [],
          }),
        },
        testSection: {
          findUnique: async () => ({
            id: "section_2",
            testId: "test_1",
            module: "reading",
            questions: [{ id: "q2", answerKey: null }],
          }),
        },
      } as never,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "SKIP_NOT_ALLOWED");
});

test("submit section rejects empty answered sections", async () => {
  const response = await postSubmitSection(
    new Request("http://localhost/api/attempts/attempt_1/submit-section", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_1" }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [{ id: "section_1", module: "reading", title: "Section 1", contentJson: null, durationMinutes: 10 }],
            },
            answers: [],
          }),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("submit section preserves objective answer values when marking them submitted", async () => {
  let updatedAnswerJson: Record<string, unknown> | null = null;

  const response = await postSubmitSection(
    new Request("http://localhost/api/attempts/attempt_1/submit-section", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_1" }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [{ id: "section_1", module: "reading", title: "Section 1", contentJson: null, durationMinutes: 10 }],
            },
            answers: [
              {
                id: "answer_1",
                sectionId: "section_1",
                answerText: "A",
                answerJson: { value: "A", isDraft: true },
                isCorrect: true,
              },
            ],
          }),
          update: async () => ({}),
        },
        attemptAnswer: {
          update: async (args: { data: { answerJson: Record<string, unknown> } }) => {
            updatedAnswerJson = args.data.answerJson;
            return {};
          },
          upsert: async () => ({}),
        },
        question: {
          count: async () => 1,
        },
        moduleScore: {
          upsert: async () => ({}),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 200);
  const persistedAnswerJson = updatedAnswerJson as Record<string, unknown> | null;
  assert.ok(persistedAnswerJson);
  assert.equal(persistedAnswerJson.value, "A");
  assert.equal(persistedAnswerJson.isDraft, false);
});

test("submit section rejects future full mock sections", async () => {
  const response = await postSubmitSection(
    new Request("http://localhost/api/attempts/attempt_1/submit-section", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_2" }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [
                { id: "section_1", module: "reading", title: "Section 1", contentJson: null, durationMinutes: 10 },
                { id: "section_2", module: "reading", title: "Section 2", contentJson: null, durationMinutes: 10 },
              ],
            },
            answers: [
              {
                id: "answer_1",
                sectionId: "section_2",
                answerText: "A",
                answerJson: { value: "A", isDraft: true },
                isCorrect: true,
              },
            ],
          }),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "SKIP_NOT_ALLOWED");
});

test("submit section rejects expired timed sections", async () => {
  const response = await postSubmitSection(
    new Request("http://localhost/api/attempts/attempt_1/submit-section", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_1" }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date("2026-05-18T00:00:00.000Z"),
            test: {
              type: "full_mock",
              sections: [{ id: "section_1", module: "reading", title: "Section 1", contentJson: null, durationMinutes: 10 }],
            },
            answers: [
              {
                id: "answer_1",
                sectionId: "section_1",
                answerText: "A",
                answerJson: { value: "A", isDraft: true },
                isCorrect: true,
                submittedAt: new Date("2026-05-18T00:00:00.000Z"),
              },
            ],
          }),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.error.code, "TIME_EXPIRED");
});

test("submit section returns not found for attempts owned by another profile", async () => {
  const response = await postSubmitSection(
    new Request("http://localhost/api/attempts/attempt_1/submit-section", {
      method: "POST",
      body: JSON.stringify({ sectionId: "section_1", responseText: "Essay response" }),
    }),
    { params: Promise.resolve({ attemptId: "attempt_1" }) },
    {
      requireCurrentUser: async () => learnerActor,
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: "another_profile",
            status: "in_progress",
            startedAt: new Date("2026-05-18T00:00:00.000Z"),
            test: { type: "full_mock", sections: [] },
            answers: [],
          }),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.error.code, "NOT_FOUND");
});

test("speaking evaluation marks the section submitted when the response is queued", async () => {
  const createdAt = new Date("2026-05-18T00:00:00.000Z");
  let sectionMarkerJson: Record<string, unknown> | null = null;

  const response = await postSpeakingEvaluation(
    new Request("http://localhost/api/evaluations/speaking", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_speaking",
        part: "part_3",
        responseText: "A spoken response transcribed as text.",
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date(),
            test: {
              type: "full_mock",
              sections: [{ id: "section_speaking", module: "speaking", durationMinutes: 15 }],
            },
            answers: [],
          }),
          update: async () => ({}),
        },
        $transaction: async (callback: (tx: {
          speakingEvaluation: {
            create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; createdAt: Date }>;
            update: (args: { where: { id: string }; data: { llmJobId: string } }) => Promise<{ id: string; createdAt: Date; status: string }>;
          };
          llmJob: {
            create: (args: { data: Record<string, unknown> }) => Promise<{ id: string; type: string }>;
          };
          attemptAnswer: {
            upsert: (args: { create: { answerJson: Record<string, unknown> } }) => Promise<Record<string, never>>;
          };
        }) => Promise<{ evaluation: { id: string; createdAt: Date; status: string }; job: { id: string; type: string } }>) =>
          callback({
            speakingEvaluation: {
              create: async () => ({ id: "eval_1", createdAt }),
              update: async () => ({ id: "eval_1", createdAt, status: "queued" }),
            },
            llmJob: {
              create: async () => ({ id: "job_1", type: "speaking_evaluation" }),
            },
            attemptAnswer: {
              upsert: async (args) => {
                sectionMarkerJson = args.create.answerJson;
                return {};
              },
            },
          }),
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 201);
  const createdSectionMarker = sectionMarkerJson as Record<string, unknown> | null;
  assert.ok(createdSectionMarker);
  assert.equal(createdSectionMarker.responseKind, "speaking");
  assert.equal(createdSectionMarker.isDraft, false);
});

test("speaking evaluation rejects expired timed sections", async () => {
  const response = await postSpeakingEvaluation(
    new Request("http://localhost/api/evaluations/speaking", {
      method: "POST",
      body: JSON.stringify({
        attemptId: "attempt_1",
        sectionId: "section_speaking",
        part: "part_2",
        responseText: "Late response",
      }),
    }),
    {
      requireCurrentUser: async () => learnerActor,
      checkRateLimitForIdentifier: async () => null,
      evaluationRateLimiter: async () => ({ allowed: true, remaining: 10, resetIn: 60 }),
      prisma: {
        mockTestAttempt: {
          findUnique: async () => ({
            id: "attempt_1",
            profileId: learnerActor.profile.id,
            status: "in_progress",
            startedAt: new Date("2026-05-18T00:00:00.000Z"),
            test: {
              type: "full_mock",
              sections: [{ id: "section_speaking", module: "speaking", durationMinutes: 15 }],
            },
            answers: [],
          }),
        },
      } as never,
      enqueueLlmJob: async () => true,
    },
  );

  assert.equal(response.status, 409);
  const payload = await response.json();
  assert.equal(payload.error.code, "TIME_EXPIRED");
});

test("admin tests route returns auth response when admin access is missing", async () => {
  const response = await getAdminTests(
    new Request("http://localhost/api/admin/tests?page=1&limit=20"),
    {
      requireAdminActorOrResponse: async () => ({
        actor: null,
        response: fail({ code: "FORBIDDEN", message: "Admin access required" }, 403),
      }),
      prisma: {} as never,
      logAuditEvent: async () => undefined,
      logRouteError: () => undefined,
    },
  );

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error.code, "FORBIDDEN");
});

test("admin tests route validates pagination before querying", async () => {
  let touchedDatabase = false;

  const response = await getAdminTests(
    new Request("http://localhost/api/admin/tests?page=0&limit=20"),
    {
      requireAdminActorOrResponse: async () => ({ actor: adminActor, response: null }),
      prisma: {
        test: {
          findMany: async () => {
            touchedDatabase = true;
            return [];
          },
          count: async () => 0,
        },
      } as never,
      logAuditEvent: async () => undefined,
      logRouteError: () => undefined,
    },
  );

  assert.equal(response.status, 400);
  assert.equal(touchedDatabase, false);
});

test("health route returns degraded status when any dependency is degraded", async () => {
  const response = await getHealth({
    checkDatabase: async () => ({ status: "ok" }),
    checkRedis: async () => ({ status: "degraded", detail: "redis down" }),
    checkStrapi: async () => ({ status: "ok" }),
    checkSupabaseConfig: async () => ({ status: "ok" }),
    checkWorkerLiveness: async () => ({ status: "ok" }),
    checkEnvironment: async () => ({ status: "ok" }),
  });

  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.data.status, "degraded");
  assert.equal(payload.data.dependencies.redis.status, "degraded");
});

test("health route returns ok when dependencies are healthy", async () => {
  const response = await getHealth({
    checkDatabase: async () => ({ status: "ok" }),
    checkRedis: async () => ({ status: "ok" }),
    checkStrapi: async () => ({ status: "ok" }),
    checkSupabaseConfig: async () => ({ status: "ok" }),
    checkWorkerLiveness: async () => ({ status: "ok" }),
    checkEnvironment: async () => ({ status: "ok" }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.data.status, "ok");
});
