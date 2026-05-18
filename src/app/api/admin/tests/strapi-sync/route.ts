import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { fetchStrapiMockTests, ensureLocalTestFromStrapi } from "@/lib/strapi/content";
import { checkRateLimitForIdentifier, submissionRateLimiter } from "@/lib/rate-limit";

export async function POST() {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

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
