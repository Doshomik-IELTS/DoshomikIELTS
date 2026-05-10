import { fail, ok } from "@/lib/api/response";
import { hasRole } from "@/lib/auth/roles";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { assetId } = await params;
  const mediaAsset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });

  if (!mediaAsset) {
    return fail({ code: "NOT_FOUND", message: "Media asset not found" }, 404);
  }

  const canAccess =
    mediaAsset.profileId === actor.profile.id ||
    hasRole(actor.profile.roles, ["admin", "reviewer", "evaluator"]);

  if (!canAccess) {
    return fail({ code: "FORBIDDEN", message: "You cannot access this media asset" }, 403);
  }

  try {
    const expiresIn = Number(process.env.SIGNED_URL_TTL_SECONDS || 900);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from(mediaAsset.bucket)
      .createSignedUrl(mediaAsset.path, expiresIn);

    if (error || !data?.signedUrl) {
      return fail({ code: "INTERNAL_ERROR", message: error?.message ?? "Could not create download URL" }, 500);
    }

    return ok({
      mediaAssetId: mediaAsset.id,
      signedUrl: data.signedUrl,
      expiresIn,
      contentType: mediaAsset.contentType,
      sizeBytes: mediaAsset.sizeBytes,
      durationSeconds: mediaAsset.durationSeconds,
    });
  } catch (error) {
    return fail({
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Could not create download URL",
    }, 500);
  }
}
