import type { IeltsModule, TestType } from "@prisma/client";

type AnswerKeyLike = {
  canonicalAnswer: string;
  explanation?: string | null;
};

type QuestionLike = {
  questionType: string;
  prompt: string;
  answerKey: AnswerKeyLike | null;
  sourceSpanJson?: unknown;
};

type SectionLike = {
  id: string;
  module: IeltsModule;
  partNumber: number | null;
  title: string;
  instructions: string | null;
  durationMinutes: number | null;
  contentJson: unknown;
  mediaAssetId?: string | null;
  questions: QuestionLike[];
};

type TestLike = {
  type: TestType;
  estimatedDurationMinutes: number | null;
  sections: SectionLike[];
};

export type TestValidationIssue = {
  scope: "test" | "section" | "question";
  sectionId?: string;
  message: string;
};

export type TestValidationResult = {
  valid: boolean;
  issues: TestValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function content(section: SectionLike) {
  return isRecord(section.contentJson) ? section.contentJson : {};
}

function isObjectiveQuestion(question: QuestionLike) {
  return !question.questionType.startsWith("writing_") && !question.questionType.startsWith("speaking_");
}

function validateObjectiveQuestions(section: SectionLike, issues: TestValidationIssue[]) {
  for (const question of section.questions) {
    if (!isObjectiveQuestion(question)) continue;
    if (!question.answerKey?.canonicalAnswer?.trim()) {
      issues.push({
        scope: "question",
        sectionId: section.id,
        message: `${section.title}: objective question is missing an answer key.`,
      });
    }
    if ((section.module === "reading" || section.module === "listening") && !question.sourceSpanJson) {
      issues.push({
        scope: "question",
        sectionId: section.id,
        message: `${section.title}: objective question is missing source-span support.`,
      });
    }
  }
}

function validateAnswerExplanations(section: SectionLike, issues: TestValidationIssue[]) {
  for (const question of section.questions) {
    if (!isObjectiveQuestion(question)) continue;
    if (!question.answerKey?.explanation?.trim()) {
      issues.push({
        scope: "question",
        sectionId: section.id,
        message: `${section.title}: question is missing an answer explanation.`,
      });
    }
  }
}

function validateReading(section: SectionLike, issues: TestValidationIssue[]) {
  const json = content(section);
  const hasPassage = hasText(json.passageText) || (Array.isArray(json.paragraphs) && json.paragraphs.length > 0);
  if (!hasPassage) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add a reading passage.` });
  }
  if (!isRecord(json.sourcePolicy) || json.sourcePolicy.copyrightChecked !== true) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: confirm original/copyright-safe source policy.` });
  }
  if (!isRecord(json.provenance) || !hasText(json.provenance.source)) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add content provenance (source, license, attribution).` });
  }
  validateObjectiveQuestions(section, issues);
  validateAnswerExplanations(section, issues);
}

function validateListening(section: SectionLike, issues: TestValidationIssue[]) {
  const json = content(section);
  const hasTranscript = hasText(json.transcript) || (Array.isArray(json.turns) && json.turns.length > 0);
  if (!hasTranscript) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add a listening script or transcript.` });
  }
  if (!section.mediaAssetId && !isRecord(json.audio)) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: attach audio metadata or mark the audio plan in content.` });
  }
  if (!isRecord(json.sourcePolicy) || json.sourcePolicy.licenseChecked !== true) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: confirm audio/script license metadata.` });
  }
  if (!isRecord(json.provenance) || !hasText(json.provenance.source)) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add content provenance (source, license, attribution).` });
  }
  validateObjectiveQuestions(section, issues);
  validateAnswerExplanations(section, issues);
}

function validateWriting(section: SectionLike, issues: TestValidationIssue[]) {
  const json = content(section);
  if (!hasText(json.question) && !hasText(json.prompt)) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add the writing task prompt.` });
  }
  if (typeof json.minWords !== "number" || json.minWords < 50) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: set a realistic minimum word count.` });
  }
  if (json.taskType === "task_1_academic" && !isRecord(json.visual)) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add visual data or a visual spec for Academic Task 1.` });
  }
}

function validateSpeaking(section: SectionLike, issues: TestValidationIssue[]) {
  const json = content(section);
  const cueCards = Array.isArray(json.cueCards) ? json.cueCards : [];
  const parts = Array.isArray(json.parts) ? json.parts : cueCards;
  if (parts.length === 0) {
    issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add speaking questions or cue cards.` });
  }
}

export function validateTestForPublish(test: TestLike): TestValidationResult {
  const issues: TestValidationIssue[] = [];

  if (!test.estimatedDurationMinutes || test.estimatedDurationMinutes < 1) {
    issues.push({ scope: "test", message: "Set the estimated test duration." });
  }

  const byModule = (module: IeltsModule) => test.sections.filter((section) => section.module === module);

  if (test.type === "full_mock") {
    const listening = byModule("listening");
    const reading = byModule("reading");
    const writing = byModule("writing");
    const speaking = byModule("speaking");
    if (listening.length !== 4) issues.push({ scope: "test", message: "Full mock requires 4 Listening parts." });
    if (reading.length !== 3) issues.push({ scope: "test", message: "Full mock requires 3 Reading passages." });
    if (writing.length < 2) issues.push({ scope: "test", message: "Full mock requires Writing Task 1 and Task 2." });
    if (speaking.length < 3) issues.push({ scope: "test", message: "Full mock requires Speaking Parts 1, 2, and 3." });
    const listeningQuestionCount = listening.reduce((sum, section) => sum + section.questions.length, 0);
    const readingQuestionCount = reading.reduce((sum, section) => sum + section.questions.length, 0);
    if (listeningQuestionCount !== 40) issues.push({ scope: "test", message: "Full Listening mock requires 40 questions." });
    if (readingQuestionCount !== 40) issues.push({ scope: "test", message: "Full Reading mock requires 40 questions." });
  }

  if (test.sections.length === 0) {
    issues.push({ scope: "test", message: "Add at least one section." });
  }

  for (const section of test.sections) {
    if (!section.instructions?.trim()) {
      issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: add learner instructions.` });
    }
    if (!section.durationMinutes || section.durationMinutes < 1) {
      issues.push({ scope: "section", sectionId: section.id, message: `${section.title}: set section timing.` });
    }
    switch (section.module) {
      case "reading":
        validateReading(section, issues);
        break;
      case "listening":
        validateListening(section, issues);
        break;
      case "writing":
        validateWriting(section, issues);
        break;
      case "speaking":
        validateSpeaking(section, issues);
        break;
    }
  }

  return { valid: issues.length === 0, issues };
}
