import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("admin resources route requires admin actor", () => {
  const source = read("src/app/api/admin/resources/route.ts");
  
  assert.match(source, /requireAdminActor/);
});

test("admin reviews route requires admin actor", () => {
  const source = read("src/app/api/admin/reviews/route.ts");
  
  assert.match(source, /requireAdminActor/);
});

test("learner cannot access admin test endpoints", () => {
  const adminTestsSource = read("src/app/api/admin/tests/route.ts");
  
  assert.match(adminTestsSource, /requireAdminActor/);
});

test("learner cannot access admin resource endpoints", () => {
  const adminResourcesSource = read("src/app/api/admin/resources/route.ts");
  
  assert.match(adminResourcesSource, /requireAdminActor/);
});

test("resources API filters published status", () => {
  const source = read("src/app/api/resources/route.ts");
  
  assert.match(source, /status.*published/);
});

test("resource detail API filters published status", () => {
  const source = read("src/app/api/resources/[id]/route.ts");
  
  assert.match(source, /status/);
});

test("profile API enforces ownership via session", () => {
  const source = read("src/app/api/profile/route.ts");
  
  assert.match(source, /requireCurrentUser/);
  assert.match(source, /profile\.id/);
});

test("attempt report route enforces ownership", () => {
  const source = read("src/app/api/attempts/[attemptId]/report/route.ts");
  
  assert.match(source, /attempt\.profileId.*actor\.profile\.id/);
});

test("score prediction route enforces ownership", () => {
  const source = read("src/app/api/attempts/[attemptId]/predict-score/route.ts");
  
  assert.match(source, /attempt\.profileId.*actor\.profile\.id/);
});

test("evaluation detail enforces ownership", () => {
  const source = read("src/app/api/evaluations/[id]/route.ts");
  
  assert.match(source, /profileId|requireAdminActor/);
});

test("score prediction response includes disclaimer", () => {
  const source = read("src/app/api/attempts/[attemptId]/predict-score/route.ts");
  
  assert.match(source, /unofficial estimate|unofficial|estimate/);
  assert.match(source, /disclaimer/);
});

test("score prediction blocks incomplete modules", () => {
  const source = read("src/app/api/attempts/[attemptId]/predict-score/route.ts");
  
  assert.match(source, /All four modules must be completed/);
  assert.match(source, /listening.*reading.*writing.*speaking/);
});

test("media download enforces ownership", () => {
  const source = read("src/app/api/media/[assetId]/download-url/route.ts");
  
  assert.match(source, /profileId.*actor\.profile\.id/);
});

test("mock test detail excludes answer keys", () => {
  const source = read("src/app/api/mock-tests/[id]/route.ts");
  
  assert.match(source, /select:/);
  assert.doesNotMatch(source, /answerKey/);
  assert.doesNotMatch(source, /canonicalAnswer/);
});

test("mock test start creates attempt with correct ownership", () => {
  const source = read("src/app/api/mock-tests/[id]/start/route.ts");
  
  assert.match(source, /profileId.*actor\.profile\.id/);
});

test("practice route filters published resources", () => {
  const source = read("src/app/api/practice/route.ts");
  
  assert.match(source, /status.*published/);
});

test("practice attempt validates ownership", () => {
  const source = read("src/app/api/practice/[id]/attempt/route.ts");
  
  assert.match(source, /requireCurrentUser/);
});
