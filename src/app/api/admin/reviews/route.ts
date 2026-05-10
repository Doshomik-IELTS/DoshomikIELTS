import { ContentStatus, JobStatus, Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";

function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return fail({ code: "FORBIDDEN", message: "Admin access required." }, 403);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdminActor();
  } catch (error) {
    const r = adminErrorResponse(error);
    if (r) return r;
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid pagination parameters." }, 400);
  }

  const skip = (page - 1) * limit;

  const contentReviewWhere: Prisma.ContentReviewWhereInput = {};
  const writingReviewWhere: Prisma.WritingEvaluationWhereInput = {};
  const speakingReviewWhere: Prisma.SpeakingEvaluationWhereInput = {};

  if (status && Object.values(ContentStatus).includes(status as ContentStatus)) {
    contentReviewWhere.status = status as ContentStatus;
  }

  if (status === "pending") {
    writingReviewWhere.status = JobStatus.queued;
    speakingReviewWhere.status = JobStatus.queued;
  } else if (status === "completed") {
    writingReviewWhere.status = JobStatus.succeeded;
    speakingReviewWhere.status = JobStatus.succeeded;
  } else if (status === "needs_review") {
    writingReviewWhere.needsHumanReview = true;
    speakingReviewWhere.needsHumanReview = true;
  } else if (status && Object.values(JobStatus).includes(status as JobStatus)) {
    writingReviewWhere.status = status as JobStatus;
    speakingReviewWhere.status = status as JobStatus;
  }

  // Fetch all three types in parallel
  const [contentReviews, writingEvaluations, speakingEvaluations] = await Promise.all([
    prisma.contentReview.findMany({
      where: contentReviewWhere,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip,
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.writingEvaluation.findMany({
      where: writingReviewWhere,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip,
      include: {
        profile: { select: { id: true, name: true, email: true } },
        attempt: { select: { id: true, test: { select: { title: true } } } },
      },
    }),
    prisma.speakingEvaluation.findMany({
      where: speakingReviewWhere,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip,
      include: {
        profile: { select: { id: true, name: true, email: true } },
        attempt: { select: { id: true, test: { select: { title: true } } } },
      },
    }),
  ]);

  // Transform and combine results
  const reviews: Array<{
    id: string;
    type: "content" | "writing" | "speaking";
    status: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, unknown>;
  }> = [];

  // Add content reviews
  for (const review of contentReviews) {
    if (type && type !== "content") continue;
    reviews.push({
      id: review.id,
      type: "content",
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      metadata: {
        contentType: review.contentType,
        contentId: review.contentId,
        notes: review.notes,
        reviewer: review.reviewer,
      },
    });
  }

  // Add writing evaluations that need review
  for (const evaluation of writingEvaluations) {
    if (type && type !== "writing") continue;
    reviews.push({
      id: evaluation.id,
      type: "writing",
      status: evaluation.needsHumanReview ? "needs_review" : evaluation.status,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
      metadata: {
        taskType: evaluation.taskType,
        wordCount: evaluation.wordCount,
        overallBand: evaluation.overallBand,
        profile: evaluation.profile,
        testTitle: evaluation.attempt?.test?.title,
      },
    });
  }

  // Add speaking evaluations that need review
  for (const evaluation of speakingEvaluations) {
    if (type && type !== "speaking") continue;
    reviews.push({
      id: evaluation.id,
      type: "speaking",
      status: evaluation.needsHumanReview ? "needs_review" : evaluation.status,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
      metadata: {
        part: evaluation.part,
        overallBand: evaluation.overallBand,
        profile: evaluation.profile,
        testTitle: evaluation.attempt?.test?.title,
      },
    });
  }

  // Sort by updatedAt descending
  reviews.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Get counts for pagination
  const [contentCount, writingCount, speakingCount] = await Promise.all([
    prisma.contentReview.count({ where: contentReviewWhere }),
    prisma.writingEvaluation.count({ where: writingReviewWhere }),
    prisma.speakingEvaluation.count({ where: speakingReviewWhere }),
  ]);

  const total = contentCount + writingCount + speakingCount;

  return ok({
    reviews,
    page,
    limit,
    total,
    breakdown: {
      content: contentCount,
      writing: writingCount,
      speaking: speakingCount,
    },
  });
}
