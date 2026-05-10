import { prisma } from "@/lib/prisma";

export function slugifyTitle(title: string) {
  const s = title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return s || "resource";
}

export async function ensureUniqueResourceSlug(base: string, excludeId?: string) {
  const slug = base || "resource";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.resource.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
  }
}
