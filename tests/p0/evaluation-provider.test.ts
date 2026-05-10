import assert from "node:assert/strict";
import test from "node:test";
import { evaluateResponse } from "../../src/lib/evaluation/provider";
import { evaluationSchema } from "../../src/lib/evaluation/schemas";

test("writing evaluation returns rubric bands and feedback", async () => {
  const result = await evaluateResponse({
    kind: "writing",
    promptLabel: "task_2",
    responseText:
      "Education improves employment opportunities. Students should learn practical skills, but they also need critical thinking. For example, strong writing helps people explain ideas clearly at work.",
    wordCount: 27,
  });

  assert.equal(typeof result.overallBand, "number");
  assert.ok(result.overallBand >= 0);
  assert.ok(result.overallBand <= 9);
  assert.ok("taskAchievement" in result.criteriaBands);
  assert.ok(Array.isArray(result.feedback.improvements));
});

test("short speaking responses are flagged for human review", async () => {
  const result = await evaluateResponse({
    kind: "speaking",
    promptLabel: "part_2",
    responseText: "I like books.",
  });

  assert.equal(result.needsHumanReview, true);
  assert.ok("pronunciation" in result.criteriaBands);
});

test("schema validates LLM output structure", () => {
  const validOutput = {
    overallBand: 6.5,
    criteriaBands: {
      taskAchievement: 7,
      coherenceCohesion: 6,
      lexicalResource: 6.5,
      grammarRangeAccuracy: 6,
    },
    feedback: {
      summary: "Good response",
      strengths: ["Clear structure"],
      improvements: ["Add more examples"],
      nextTask: "Expand your examples",
    },
    needsHumanReview: false,
    provider: "openai",
    model: "gpt-4o",
    promptVersion: "ielts-rubric-v1",
  };

  const parsed = evaluationSchema.parse(validOutput);
  assert.equal(parsed.overallBand, 6.5);
});

test("schema rejects invalid band scores", () => {
  const invalidOutput = {
    overallBand: 10,
    criteriaBands: { taskAchievement: 11 },
    feedback: { summary: "", strengths: [], improvements: [], nextTask: "" },
    provider: "openai",
    model: "gpt-4o",
    promptVersion: "ielts-rubric-v1",
  };

  assert.throws(() => evaluationSchema.parse(invalidOutput));
});

test("schema rejects negative band scores", () => {
  const invalidOutput = {
    overallBand: -1,
    criteriaBands: { taskAchievement: -1 },
    feedback: { summary: "", strengths: [], improvements: [], nextTask: "" },
    provider: "openai",
    model: "gpt-4o",
    promptVersion: "ielts-rubric-v1",
  };

  assert.throws(() => evaluationSchema.parse(invalidOutput));
});

test("writing response has all four criteria", async () => {
  const result = await evaluateResponse({
    kind: "writing",
    promptLabel: "task_1",
    responseText: "The graph shows overall trends. First, values increased significantly.",
    wordCount: 15,
  });

  assert.ok("taskAchievement" in result.criteriaBands);
  assert.ok("coherenceCohesion" in result.criteriaBands);
  assert.ok("lexicalResource" in result.criteriaBands);
  assert.ok("grammarRangeAccuracy" in result.criteriaBands);
});

test("speaking response has all four criteria", async () => {
  const result = await evaluateResponse({
    kind: "speaking",
    promptLabel: "part_2",
    responseText: "I enjoy reading books in my spare time.",
    wordCount: 9,
  });

  assert.ok("fluencyCoherence" in result.criteriaBands);
  assert.ok("lexicalResource" in result.criteriaBands);
  assert.ok("grammarRangeAccuracy" in result.criteriaBands);
  assert.ok("pronunciation" in result.criteriaBands);
});

test("provider metadata is included in result", async () => {
  const result = await evaluateResponse({
    kind: "writing",
    promptLabel: "task_2",
    responseText: "Sample text for testing provider metadata.",
    wordCount: 6,
  });

  assert.equal(typeof result.provider, "string");
  assert.equal(typeof result.model, "string");
  assert.equal(typeof result.promptVersion, "string");
});