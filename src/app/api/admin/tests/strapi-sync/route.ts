import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { ok, fail } from "@/lib/api/response";
import { fetchStrapiMockTests, ensureLocalTestFromStrapi } from "@/lib/strapi/content";
import { checkRateLimitForIdentifier, submissionRateLimiter } from "@/lib/rate-limit";

export async function POST() {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  if (!canAccessAdminRoutes(actor.profile.roles)) {
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const rateLimitResponse = await checkRateLimitForIdentifier(submissionRateLimiter, actor.profile.id);
  if (rateLimitResponse) return rateLimitResponse;

  const strapiTests = await fetchStrapiMockTests();
  if (!strapiTests) {
    return fail({ code: "INTERNAL_ERROR", message: "Strapi is not configured or unreachable" }, 503);
  }

  const imported: { id: string; title: string; alreadyExists: boolean }[] = [];

  for (const test of strapiTests) {
    const existing = await prisma.test.findUnique({ where: { id: test.id } });
    if (existing) {
      imported.push({ id: test.id, title: test.title, alreadyExists: true });
      continue;
    }

    const created = await ensureLocalTestFromStrapi(test.id);
    if (created) {
      imported.push({ id: created.id, title: created.title, alreadyExists: false });
    }
  }

  return ok({
    imported: imported.filter((t) => !t.alreadyExists).length,
    total: strapiTests.length,
    tests: imported,
  });
}
