import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
    console.error("[Audit] Failed to write audit log:", error);
  }
}