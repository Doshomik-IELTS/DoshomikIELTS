import { JobStatus, type IeltsModule } from "@prisma/client";
import { evaluateResponse } from "@/lib/evaluation/provider";
import { prisma } from "@/lib/prisma";

export async function processLlmJob(llmJobId: string) {
  const job = await prisma.llmJob.findUnique({ where: { id: llmJobId } });

  if (!job) {
    throw new Error(`LLM job ${llmJobId} not found`);
  }

  if (job.status === JobStatus.succeeded) {
    return job;
  }

  await prisma.llmJob.update({
    where: { id: llmJobId },
    data: {
      status: JobStatus.processing,
      attemptCount: { increment: 1 },
    },
  });

  try {
    if (job.type === "writing_evaluation") {
      return await processWritingJob(llmJobId);
    }

    if (job.type === "speaking_evaluation") {
      return await processSpeakingJob(llmJobId);
    }

    throw new Error(`Unsupported LLM job type: ${job.type}`);
  } catch (error) {
    await prisma.llmJob.update({
      where: { id: llmJobId },
      data: {
        status: JobStatus.failed,
        errorJson: {
          message: error instanceof Error ? error.message : "Unknown worker error",
        },
      },
    });
    throw error;
  }
}

async function processWritingJob(llmJobId: string) {
  const evaluation = await prisma.writingEvaluation.findFirst({
    where: { llmJobId },
  });

  if (!evaluation) {
    throw new Error(`Writing evaluation for job ${llmJobId} not found`);
  }

  const result = await evaluateResponse({
    kind: "writing",
    promptLabel: evaluation.taskType,
    responseText: evaluation.responseText,
    wordCount: evaluation.wordCount ?? undefined,
  });

  const updatedJob = await prisma.$transaction(async (tx) => {
    await tx.writingEvaluation.update({
      where: { id: evaluation.id },
      data: {
        status: result.needsHumanReview ? JobStatus.needs_review : JobStatus.succeeded,
        criteriaBandsJson: result.criteriaBands,
        overallBand: result.overallBand,
        feedbackJson: result.feedback,
        needsHumanReview: result.needsHumanReview,
      },
    });

    await tx.moduleScore.upsert({
      where: {
        attemptId_module: {
          attemptId: evaluation.attemptId,
          module: "writing" as IeltsModule,
        },
      },
      create: {
        attemptId: evaluation.attemptId,
        module: "writing",
        estimatedBand: result.overallBand,
        criteriaJson: result.criteriaBands,
        feedbackJson: result.feedback,
        confidence: "low",
      },
      update: {
        estimatedBand: result.overallBand,
        criteriaJson: result.criteriaBands,
        feedbackJson: result.feedback,
        confidence: "low",
      },
    });

    return tx.llmJob.update({
      where: { id: llmJobId },
      data: {
        status: result.needsHumanReview ? JobStatus.needs_review : JobStatus.succeeded,
        provider: result.provider,
        model: result.model,
        promptVersion: result.promptVersion,
        outputJson: {
          overallBand: result.overallBand,
          criteriaBands: result.criteriaBands,
          feedback: result.feedback,
          needsHumanReview: result.needsHumanReview,
        },
      },
    });
  });

  await completeAttemptIfReady(evaluation.attemptId);
  return updatedJob;
}

async function processSpeakingJob(llmJobId: string) {
  const evaluation = await prisma.speakingEvaluation.findFirst({
    where: { llmJobId },
  });

  if (!evaluation) {
    throw new Error(`Speaking evaluation for job ${llmJobId} not found`);
  }

  const responseText = evaluation.responseText || evaluation.transcript || "";
  const result = await evaluateResponse({
    kind: "speaking",
    promptLabel: evaluation.part,
    responseText,
  });

  const updatedJob = await prisma.$transaction(async (tx) => {
    await tx.speakingEvaluation.update({
      where: { id: evaluation.id },
      data: {
        status: result.needsHumanReview ? JobStatus.needs_review : JobStatus.succeeded,
        transcript: evaluation.transcript || evaluation.responseText,
        criteriaBandsJson: result.criteriaBands,
        overallBand: result.overallBand,
        feedbackJson: result.feedback,
        pronunciationAvailable: Boolean(evaluation.mediaAssetId),
        needsHumanReview: result.needsHumanReview,
      },
    });

    await tx.moduleScore.upsert({
      where: {
        attemptId_module: {
          attemptId: evaluation.attemptId,
          module: "speaking" as IeltsModule,
        },
      },
      create: {
        attemptId: evaluation.attemptId,
        module: "speaking",
        estimatedBand: result.overallBand,
        criteriaJson: result.criteriaBands,
        feedbackJson: result.feedback,
        confidence: evaluation.mediaAssetId ? "medium" : "low",
      },
      update: {
        estimatedBand: result.overallBand,
        criteriaJson: result.criteriaBands,
        feedbackJson: result.feedback,
        confidence: evaluation.mediaAssetId ? "medium" : "low",
      },
    });

    return tx.llmJob.update({
      where: { id: llmJobId },
      data: {
        status: result.needsHumanReview ? JobStatus.needs_review : JobStatus.succeeded,
        provider: result.provider,
        model: result.model,
        promptVersion: result.promptVersion,
        outputJson: {
          overallBand: result.overallBand,
          criteriaBands: result.criteriaBands,
          feedback: result.feedback,
          needsHumanReview: result.needsHumanReview,
        },
      },
    });
  });

  await completeAttemptIfReady(evaluation.attemptId);
  return updatedJob;
}

async function completeAttemptIfReady(attemptId: string) {
  const scores = await prisma.moduleScore.findMany({
    where: { attemptId },
    select: { module: true },
  });
  const completed = new Set(scores.map((score) => score.module));
  const allModulesComplete = ["listening", "reading", "writing", "speaking"].every((module) =>
    completed.has(module as IeltsModule),
  );

  if (!allModulesComplete) return;

  await prisma.mockTestAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });
}
