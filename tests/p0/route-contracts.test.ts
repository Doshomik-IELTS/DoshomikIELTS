import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("learner mock test route does not select answer keys", () => {
  const source = read("src/app/api/mock-tests/[id]/route.ts");

  assert.match(source, /questions:\s*{[\s\S]*select:/);
  assert.doesNotMatch(source, /answerKey/);
  assert.doesNotMatch(source, /canonicalAnswer/);
});

test("score prediction route requires all four module scores", () => {
  const source = read("src/app/api/attempts/[attemptId]/predict-score/route.ts");

  for (const ieltsModule of ["listening", "reading", "writing", "speaking"]) {
    assert.match(source, new RegExp(ieltsModule));
  }
  assert.match(source, /All module scores must be available/);
  assert.match(source, /unofficial estimate/);
});

test("attempt answer route preserves draft state separately from submitted answers", () => {
  const source = read("src/app/api/attempts/[attemptId]/answers/route.ts");

  assert.match(source, /isDraft/);
  assert.match(source, /answerJson:\s*{\s*value:\s*userAnswer,\s*isDraft\s*}/);
});

test("private media signed URL routes exist and enforce ownership checks", () => {
  const uploadSource = read("src/app/api/media/upload-url/route.ts");
  const downloadSource = read("src/app/api/media/[assetId]/download-url/route.ts");

  assert.match(uploadSource, /createSignedUploadUrl/);
  assert.match(uploadSource, /speaking-recordings/);
  assert.match(downloadSource, /createSignedUrl/);
  assert.match(downloadSource, /mediaAsset\.profileId === actor\.profile\.id/);
});

test("authenticated rate limited routes use server-side actor identity", () => {
  for (const relativePath of [
    "src/app/api/evaluations/writing/route.ts",
    "src/app/api/evaluations/speaking/route.ts",
    "src/app/api/media/upload-url/route.ts",
    "src/app/api/attempts/[attemptId]/predict-score/route.ts",
    "src/app/api/referrals/apply/route.ts",
  ]) {
    const source = read(relativePath);
    assert.match(source, /actor\.profile\.id|current\.profile\.id/);
    assert.doesNotMatch(source, /x-user-id/);
  }
});

test("api routes do not parse pagination manually", () => {
  const apiFiles = [
    "src/app/api/practice/route.ts",
    "src/app/api/practice/attempts/route.ts",
    "src/app/api/mock-tests/route.ts",
    "src/app/api/admin/tests/route.ts",
    "src/app/api/admin/reviews/route.ts",
    "src/app/api/admin/referrals/route.ts",
    "src/app/api/admin/referrals/credits/route.ts",
    "src/app/api/credits/ledger/route.ts",
    "src/app/api/referrals/me/redemptions/route.ts",
  ];

  for (const relativePath of apiFiles) {
    const source = read(relativePath);
    assert.doesNotMatch(source, /parseInt\(searchParams/);
    assert.match(source, /parseQuery\(request/);
  }
});

test("llm provider calls use timeout and circuit breakers", () => {
  const source = read("src/lib/evaluation/llm-provider.ts");

  assert.match(source, /withTimeout/);
  assert.match(source, /openAiCircuitBreaker\.execute/);
  assert.match(source, /anthropicCircuitBreaker\.execute/);
  assert.match(source, /geminiCircuitBreaker\.execute/);
});

test("queue enqueue path reuses queues and records failed jobs", () => {
  const source = read("src/lib/queue/enqueue.ts");
  const workerSource = read("src/workers/index.ts");

  assert.match(source, /getQueue/);
  assert.doesNotMatch(source, /finally\s*{[\s\S]*queue\.close/);
  assert.match(workerSource, /worker\.on\("failed"/);
  assert.match(workerSource, /worker\.on\("stalled"/);
});
