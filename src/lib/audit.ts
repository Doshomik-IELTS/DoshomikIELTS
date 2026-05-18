import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/observability/logger";

interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorProfileId: event.actorId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        metadataJson: event.metadata ? (event.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    logger.error("audit log write failed", {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}