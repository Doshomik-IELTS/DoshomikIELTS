import type { Prisma, Role } from "@prisma/client";
import { fail, ok } from "@/lib/api/response";
import { hasRole } from "@/lib/auth/roles";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const SPEAKING_TYPES = new Set(["audio/webm", "audio/mpeg", "audio/mp4", "audio/wav"]);
const LISTENING_TYPES = new Set(["audio/mpeg", "audio/mp4", "audio/wav"]);
const DEFAULT_SIGNED_URL_TTL_SECONDS = 900;

type UploadPurpose = "speaking_recording" | "listening_audio";

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    purpose?: UploadPurpose;
    contentType?: string;
    sizeBytes?: number;
    durationSeconds?: number;
    licenseMetadata?: unknown;
  };

  if (!body.purpose || !body.contentType || !body.sizeBytes) {
    return fail({ code: "VALIDATION_ERROR", message: "purpose, contentType, and sizeBytes are required" }, 400);
  }

  const validation = validateUploadRequest(body, actor.profile.roles);
  if (validation) return validation;

  const bucket = body.purpose === "speaking_recording" ? "speaking-recordings" : "listening-audio";
  const extension = extensionForContentType(body.contentType);
  const path = `${actor.profile.id}/${crypto.randomUUID()}.${extension}`;

  let signedUrl: string;
  let token: string | undefined;
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data?.signedUrl) {
      return fail({ code: "INTERNAL_ERROR", message: error?.message ?? "Could not create upload URL" }, 500);
    }
    signedUrl = data.signedUrl;
    token = data.token;
  } catch (error) {
    return fail({
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Could not create upload URL",
    }, 500);
  }

  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      profileId: actor.profile.id,
      bucket,
      path,
      purpose: body.purpose,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes,
      durationSeconds: body.durationSeconds ?? null,
      licenseMetadataJson: body.licenseMetadata as Prisma.InputJsonValue | undefined,
    },
  });

  return ok({
    mediaAssetId: mediaAsset.id,
    bucket,
    path,
    signedUrl,
    token,
    expiresIn: Number(process.env.SIGNED_URL_TTL_SECONDS || DEFAULT_SIGNED_URL_TTL_SECONDS),
  }, { status: 201 });
}

function validateUploadRequest(
  body: { purpose?: UploadPurpose; contentType?: string; sizeBytes?: number; durationSeconds?: number; licenseMetadata?: unknown },
  roles: Role[],
) {
  if (body.purpose !== "speaking_recording" && body.purpose !== "listening_audio") {
    return fail({ code: "VALIDATION_ERROR", message: "Unsupported upload purpose" }, 400);
  }

  if (body.purpose === "speaking_recording") {
    if (!body.contentType || !SPEAKING_TYPES.has(body.contentType)) {
      return fail({ code: "VALIDATION_ERROR", message: "Unsupported speaking audio type" }, 400);
    }

    const maxBytes = Number(process.env.MAX_SPEAKING_AUDIO_MB || 25) * 1024 * 1024;
    if (!body.sizeBytes || body.sizeBytes <= 0 || body.sizeBytes > maxBytes) {
      return fail({ code: "VALIDATION_ERROR", message: "Speaking recording is too large" }, 400);
    }

    const maxSeconds = Number(process.env.MAX_SPEAKING_AUDIO_SECONDS || 300);
    if (body.durationSeconds && body.durationSeconds > maxSeconds) {
      return fail({ code: "VALIDATION_ERROR", message: "Speaking recording is too long" }, 400);
    }
  }

  if (body.purpose === "listening_audio") {
    if (!hasRole(roles, ["admin", "reviewer"])) {
      return fail({ code: "FORBIDDEN", message: "Admin access required for listening uploads" }, 403);
    }
    if (!body.contentType || !LISTENING_TYPES.has(body.contentType)) {
      return fail({ code: "VALIDATION_ERROR", message: "Unsupported listening audio type" }, 400);
    }
    if (!body.licenseMetadata) {
      return fail({ code: "VALIDATION_ERROR", message: "Listening uploads require license metadata" }, 400);
    }
  }

  return null;
}

function extensionForContentType(contentType: string) {
  switch (contentType) {
    case "audio/webm":
      return "webm";
    case "audio/mp4":
      return "m4a";
    case "audio/wav":
      return "wav";
    default:
      return "mp3";
  }
}
