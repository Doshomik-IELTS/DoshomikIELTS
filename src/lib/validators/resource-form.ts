import { z } from "zod";
import { examplesJsonSchema } from "@/lib/validators/admin-resource";
import { RESOURCE_CATEGORY_VALUES } from "@/lib/resources/constants";

export const resourceFormSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(200),
    slug: z.string().max(120).optional(),
    category: z.enum(RESOURCE_CATEGORY_VALUES),
    difficulty: z.enum(["basic", "intermediate", "advanced"]),
    body: z.string().min(1, "Body is required.").max(500_000),
    tags: z.string(),
    examplesJsonText: z.string(),
    status: z.enum(["draft", "review", "published", "archived"]),
  })
  .superRefine((data, ctx) => {
    if (data.slug?.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "Slug: lowercase letters, numbers, hyphens only.",
        path: ["slug"],
      });
    }
    const ex = data.examplesJsonText.trim();
    if (!ex) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(ex);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Examples must be valid JSON.",
        path: ["examplesJsonText"],
      });
      return;
    }
    const r = examplesJsonSchema.safeParse(parsed);
    if (!r.success) {
      ctx.addIssue({
        code: "custom",
        message: "Examples must be an array of { label?, text } objects.",
        path: ["examplesJsonText"],
      });
    }
  });

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;

export function resourceFormValuesToApiBody(values: ResourceFormValues) {
  const tags = values.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  let examplesJson: unknown = undefined;
  const ex = values.examplesJsonText.trim();
  if (ex) examplesJson = JSON.parse(ex) as unknown;
  return {
    title: values.title.trim(),
    slug: values.slug?.trim() ? values.slug.trim() : null,
    category: values.category,
    difficulty: values.difficulty,
    body: values.body,
    tags,
    examplesJson,
    status: values.status,
  };
}
