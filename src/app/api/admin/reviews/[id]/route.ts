import { ContentStatus, type Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { logRouteError } from "@/lib/api/logging";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  try {
    const { id } = await params;

  // Try to find the review in all three collections
  const [contentReview, writingEvaluation, speakingEvaluation] = await Promise.all([
    prisma.contentReview.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.writingEvaluation.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, name: true, email: true } },
        attempt: {
          include: {
            test: { select: { id: true, title: true } },
          },
        },
        job: { select: { id: true, status: true, provider: true, model: true } },
      },
    }),
    prisma.speakingEvaluation.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, name: true, email: true } },
        attempt: {
          include: {
            test: { select: { id: true, title: true } },
          },
        },
        media: { select: { id: true, path: true, bucket: true, contentType: true } },
        job: { select: { id: true, status: true, provider: true, model: true } },
      },
    }),
  ]);

  if (contentReview) {
    return ok({
      type: "content",
      review: contentReview,
    });
  }

  if (writingEvaluation) {
    return ok({
      type: "writing",
      review: writingEvaluation,
    });
  }

  if (speakingEvaluation) {
    return ok({
      type: "speaking",
      review: speakingEvaluation,
    });
  }

    return fail({ code: "NOT_FOUND", message: "Review not found." }, 404);
  } catch (error) {
    logRouteError("/api/admin/reviews/[id]", error, { method: "GET", actorId: adminAuth.actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Unexpected internal error" }, 500);
  }
}

// PATCH endpoint to update review status (approve/reject content reviews, flag for human review)
const reviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "flag_for_review", "set_band"]),
  type: z.enum(["content", "writing", "speaking"]),
  notes: z.string().max(4000).optional(),
  band: z.number().min(0).max(9).optional(),
  feedback: z.unknown().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  try {
    const { id } = await params;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body." }, 400);
    }

    const parsedBody = reviewActionSchema.safeParse(json);
    if (!parsedBody.success) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Invalid review action data.",
        details: z.treeifyError(parsedBody.error),
      }, 400);
    }
    const parsed = parsedBody.data;

    const { action, type } = parsed;

    if (type === "content") {
      if (action === "approve") {
        await prisma.$transaction(async (tx) => {
          const review = await tx.contentReview.update({
            where: { id },
            data: { status: ContentStatus.published, reviewerId: actor.profile.id, notes: parsed.notes },
          });

          if (review.contentType === "resource") {
            await tx.resource.update({
              where: { id: review.contentId },
              data: { status: ContentStatus.published, publishedAt: new Date() },
            });
          }
          if (review.contentType === "test") {
            await tx.test.update({
              where: { id: review.contentId },
              data: { status: ContentStatus.published, publishedAt: new Date() },
            });
          }
        });

        logAuditEvent({
          action: "content_review.approve",
          entityType: "ContentReview",
          entityId: id,
          actorId: actor.profile.id,
        });
      } else if (action === "reject") {
        await prisma.$transaction(async (tx) => {
          const review = await tx.contentReview.update({
            where: { id },
            data: { status: ContentStatus.draft, reviewerId: actor.profile.id, notes: parsed.notes },
          });

          if (review.contentType === "resource") {
            await tx.resource.update({
              where: { id: review.contentId },
              data: { status: ContentStatus.draft },
            });
          }
          if (review.contentType === "test") {
            await tx.test.update({
              where: { id: review.contentId },
              data: { status: ContentStatus.draft },
            });
          }
        });

        logAuditEvent({
          action: "content_review.reject",
          entityType: "ContentReview",
          entityId: id,
          actorId: actor.profile.id,
        });
      } else {
        return fail({ code: "VALIDATION_ERROR", message: "Unsupported content review action." }, 400);
      }
    } else if (type === "writing") {
      if (action === "flag_for_review") {
        await prisma.writingEvaluation.update({
          where: { id },
          data: { needsHumanReview: true },
        });

        logAuditEvent({
          action: "writing_evaluation.flag",
          entityType: "WritingEvaluation",
          entityId: id,
          actorId: actor.profile.id,
        });
      } else if (action === "set_band") {
        if (typeof parsed.band !== "number" || parsed.band < 0 || parsed.band > 9) {
          return fail({ code: "VALIDATION_ERROR", message: "Band must be a number from 0 to 9." }, 400);
        }
        await prisma.writingEvaluation.update({
          where: { id },
          data: { 
            overallBand: parsed.band,
            feedbackJson: parsed.feedback as Prisma.InputJsonValue | undefined,
            status: "succeeded",
            needsHumanReview: false,
          },
        });

        logAuditEvent({
          action: "writing_evaluation.set_band",
          entityType: "WritingEvaluation",
          entityId: id,
          actorId: actor.profile.id,
          metadata: { band: parsed.band },
        });
      } else {
        return fail({ code: "VALIDATION_ERROR", message: "Unsupported writing review action." }, 400);
      }
    } else if (type === "speaking") {
      if (action === "flag_for_review") {
        await prisma.speakingEvaluation.update({
          where: { id },
          data: { needsHumanReview: true },
        });

        logAuditEvent({
          action: "speaking_evaluation.flag",
          entityType: "SpeakingEvaluation",
          entityId: id,
          actorId: actor.profile.id,
        });
      } else if (action === "set_band") {
        if (typeof parsed.band !== "number" || parsed.band < 0 || parsed.band > 9) {
          return fail({ code: "VALIDATION_ERROR", message: "Band must be a number from 0 to 9." }, 400);
        }
        await prisma.speakingEvaluation.update({
          where: { id },
          data: { 
            overallBand: parsed.band,
            feedbackJson: parsed.feedback as Prisma.InputJsonValue | undefined,
            status: "succeeded",
            needsHumanReview: false,
          },
        });

        logAuditEvent({
          action: "speaking_evaluation.set_band",
          entityType: "SpeakingEvaluation",
          entityId: id,
          actorId: actor.profile.id,
          metadata: { band: parsed.band },
        });
      } else {
        return fail({ code: "VALIDATION_ERROR", message: "Unsupported speaking review action." }, 400);
      }
    } else {
      return fail({ code: "VALIDATION_ERROR", message: "Unsupported review type." }, 400);
    }

    return ok({ success: true });
  } catch (error) {
    logRouteError("/api/admin/reviews/[id]", error, { method: "PATCH", actorId: actor.profile.id });
    return fail({ code: "INTERNAL_ERROR", message: "Could not update review." }, 500);
  }
}
