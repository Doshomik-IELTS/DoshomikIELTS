import type { Prisma } from "@prisma/client";

type SectionLike = {
  id: string;
  module: string;
  durationMinutes: number | null;
};

type AttemptAnswerLike = {
  id: string;
  sectionId: string;
  questionId: string | null;
  answerText: string | null;
  answerJson: Prisma.JsonValue;
  submittedAt: Date;
};

type SectionResponseKind = "writing" | "speaking";
type WriteAccessErrorCode = "INVALID_STATE" | "INVALID_DIRECTION" | "SKIP_NOT_ALLOWED" | "TIME_EXPIRED";

export const SECTION_SUBMISSION_GRACE_SECONDS = 5;

export function isDraftAnswer(answerJson: Prisma.JsonValue) {
  if (!isRecord(answerJson)) {
    return false;
  }

  return answerJson.isDraft === true;
}

export function buildAnswerJson(
  answerJson: Prisma.JsonValue,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base = isRecord(answerJson) ? answerJson : {};
  return {
    ...base,
    ...patch,
  } as Prisma.InputJsonObject;
}

export function buildSectionResponseJson(params: {
  responseKind: SectionResponseKind;
  responseText?: string | null;
  mediaAssetId?: string | null;
  isDraft: boolean;
}): Prisma.InputJsonValue {
  return {
    responseKind: params.responseKind,
    responseText: params.responseText ?? null,
    mediaAssetId: params.mediaAssetId ?? null,
    isDraft: params.isDraft,
  } as Prisma.InputJsonObject;
}

export function getSectionResponseKey(module: string): SectionResponseKind | null {
  if (module === "writing" || module === "speaking") {
    return module;
  }

  return null;
}

export function getSectionMarkerId(attemptId: string, sectionId: string) {
  return `${attemptId}-${sectionId}-section-response`;
}

export function getSubmittedSectionIds(answers: AttemptAnswerLike[]) {
  return new Set(answers.filter((answer) => !isDraftAnswer(answer.answerJson)).map((answer) => answer.sectionId));
}

export function getCurrentSectionIndex(sections: SectionLike[], answers: AttemptAnswerLike[]) {
  const submittedSectionIds = getSubmittedSectionIds(answers);
  const firstUnsubmittedIndex = sections.findIndex((section) => !submittedSectionIds.has(section.id));
  return firstUnsubmittedIndex === -1 ? Math.max(sections.length - 1, 0) : firstUnsubmittedIndex;
}

export function getSectionIndex(sections: Pick<SectionLike, "id">[], sectionId: string) {
  return sections.findIndex((section) => section.id === sectionId);
}

export function getSectionRemainingSeconds(
  attemptStartedAt: Date,
  sections: SectionLike[],
  answers: AttemptAnswerLike[],
  activeSectionIndex: number,
  now = new Date(),
) {
  const section = sections[activeSectionIndex];
  if (!section || !section.durationMinutes || section.durationMinutes <= 0) {
    return null;
  }

  const startedAt = getSectionStartedAt(attemptStartedAt, sections, answers, activeSectionIndex);
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  return Math.max(0, section.durationMinutes * 60 - elapsedSeconds);
}

export function isSectionExpired(
  attemptStartedAt: Date,
  sections: SectionLike[],
  answers: AttemptAnswerLike[],
  sectionIndex: number,
  now = new Date(),
  graceSeconds = SECTION_SUBMISSION_GRACE_SECONDS,
) {
  const deadlineAt = getSectionDeadlineAt(attemptStartedAt, sections, answers, sectionIndex);
  if (!deadlineAt) {
    return false;
  }

  return now.getTime() > deadlineAt.getTime() + graceSeconds * 1000;
}

export function getSectionWriteAccessError(params: {
  attemptStartedAt: Date;
  testType: string | null | undefined;
  sections: SectionLike[];
  answers: AttemptAnswerLike[];
  sectionId: string;
  now?: Date;
}): { code: WriteAccessErrorCode; message: string } | null {
  const sectionIndex = getSectionIndex(params.sections, params.sectionId);
  if (sectionIndex === -1) {
    return null;
  }

  const submittedSectionIds = getSubmittedSectionIds(params.answers);
  if (submittedSectionIds.has(params.sectionId)) {
    return { code: "INVALID_STATE", message: "Section already submitted" };
  }

  const currentSectionIndex = getCurrentSectionIndex(params.sections, params.answers);
  if (params.testType === "full_mock" && sectionIndex !== currentSectionIndex) {
    if (sectionIndex > currentSectionIndex) {
      return { code: "SKIP_NOT_ALLOWED", message: "Cannot skip ahead in a full mock attempt" };
    }

    return { code: "INVALID_DIRECTION", message: "Cannot return to an earlier section" };
  }

  if (
    sectionIndex === currentSectionIndex
    && isSectionExpired(params.attemptStartedAt, params.sections, params.answers, sectionIndex, params.now)
  ) {
    return { code: "TIME_EXPIRED", message: "Time for this section has expired" };
  }

  return null;
}

export function getSavedAnswersForSection(section: SectionLike, answers: AttemptAnswerLike[]) {
  const savedAnswers = Object.fromEntries(
    answers
      .filter((answer) => answer.sectionId === section.id && answer.questionId && answer.answerText)
      .map((answer) => [answer.questionId, answer.answerText ?? ""]),
  );

  const sectionMarker = answers.find((answer) => answer.sectionId === section.id && !answer.questionId);
  const responseText = getSectionResponseText(sectionMarker);
  const responseKey = getSectionResponseKey(section.module);
  if (responseKey && responseText) {
    savedAnswers[responseKey] = responseText;
  }

  const mediaAssetId = getSectionMediaAssetId(sectionMarker);
  if (mediaAssetId) {
    savedAnswers.mediaAssetId = mediaAssetId;
  }

  return savedAnswers;
}

export function getSectionResponseText(answer: AttemptAnswerLike | null | undefined) {
  if (!answer) return "";
  if (typeof answer.answerText === "string" && answer.answerText.trim().length > 0) {
    return answer.answerText;
  }

  if (!isRecord(answer.answerJson)) {
    return "";
  }

  return typeof answer.answerJson.responseText === "string" ? answer.answerJson.responseText : "";
}

export function getSectionMediaAssetId(answer: AttemptAnswerLike | null | undefined) {
  if (!answer || !isRecord(answer.answerJson)) {
    return null;
  }

  return typeof answer.answerJson.mediaAssetId === "string" ? answer.answerJson.mediaAssetId : null;
}

function getSectionStartedAt(
  attemptStartedAt: Date,
  sections: SectionLike[],
  answers: AttemptAnswerLike[],
  activeSectionIndex: number,
) {
  if (activeSectionIndex <= 0) {
    return attemptStartedAt;
  }

  const previousSectionId = sections[activeSectionIndex - 1]?.id;
  if (!previousSectionId) {
    return attemptStartedAt;
  }

  const previousSubmittedAt = answers
    .filter((answer) => answer.sectionId === previousSectionId && !isDraftAnswer(answer.answerJson))
    .reduce<Date | null>((latest, answer) => {
      if (!latest || answer.submittedAt > latest) {
        return answer.submittedAt;
      }
      return latest;
    }, null);

  return previousSubmittedAt ?? attemptStartedAt;
}

function getSectionDeadlineAt(
  attemptStartedAt: Date,
  sections: SectionLike[],
  answers: AttemptAnswerLike[],
  sectionIndex: number,
) {
  const section = sections[sectionIndex];
  if (!section || !section.durationMinutes || section.durationMinutes <= 0) {
    return null;
  }

  const startedAt = getSectionStartedAt(attemptStartedAt, sections, answers, sectionIndex);
  return new Date(startedAt.getTime() + section.durationMinutes * 60 * 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
