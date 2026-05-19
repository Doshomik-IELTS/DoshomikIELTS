import { ContentStatus, JobStatus, Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { logRouteError } from "@/lib/api/logging";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  status: z.enum([
    "draft",
    "review",
    "published",
    "archived",
    "pending",
    "completed",
    "queued",
    "processing",
    "succeeded",
    "failed",
    "needs_review",
  ]).optional(),
  type: z.enum(["content", "writing", "speaking"]).optional(),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  try {
    const parsedQuery = parseQuery(request, querySchema);
    if (parsedQuery.response) return parsedQuery.response;
    const { page, limit, status, type } = parsedQuery.data;

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
  } catch (error) {
    logRouteError("/api/admin/reviews", error, { method: "GET", actorId: adminAuth.actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}
