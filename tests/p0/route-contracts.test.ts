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
