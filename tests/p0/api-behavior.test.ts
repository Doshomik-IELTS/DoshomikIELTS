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
          findUnique: async () => ({ id: "attempt_1", profileId: learnerActor.profile.id }),
        },
        $transaction: async (callback: (tx: {
          writingEvaluation: {
            create: (args: { data: { profileId: string; attemptId: string; sectionId: string; taskType: string; responseText: string; wordCount: number; status: string } }) => Promise<{ id: string; createdAt: Date }>;
            update: (args: { where: { id: string }; data: { llmJobId: string } }) => Promise<{ id: string; createdAt: Date; status: string }>;
          };
          llmJob: {
            create: (args: { data: { type: string; status: string; inputJson: Record<string, unknown> } }) => Promise<{ id: string; type: string }>;
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
        mockTestAttempt: { findUnique: async () => ({ id: "attempt_1", profileId: learnerActor.profile.id, status: "in_progress", testId: "test_1" }) },
      } as never,
    },
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, "VALIDATION_ERROR");
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
            test: {
              sections: [{ id: "section_1", module: "reading", title: "Section 1", contentJson: null }],
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
    checkEnvironment: async () => ({ status: "ok" }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.data.status, "ok");
});
