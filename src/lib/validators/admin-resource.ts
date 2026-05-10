import { z } from "zod";
import { RESOURCE_CATEGORY_VALUES } from "@/lib/resources/constants";

const exampleItemSchema = z.object({
  label: z.string().max(200).optional().nullable(),
  text: z.string().max(50_000),
});

export const examplesJsonSchema = z.array(exampleItemSchema).optional().nullable();

export const adminResourceCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only.")
    .optional()
    .nullable(),
  category: z.enum(RESOURCE_CATEGORY_VALUES),
  difficulty: z.enum(["basic", "intermediate", "advanced"]),
  body: z.string().min(1).max(500_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(80).optional().default([]),
  examplesJson: examplesJsonSchema,
  status: z.enum(["draft", "review", "published", "archived"]).optional().default("draft"),
});

export const adminResourcePatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only.")
      .optional()
      .nullable(),
    category: z.enum(RESOURCE_CATEGORY_VALUES).optional(),
    difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
    body: z.string().min(1).max(500_000).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(80).optional(),
    examplesJson: examplesJsonSchema,
    status: z.enum(["draft", "review", "published", "archived"]).optional(),
  })
  .strict();

export const adminResourceListQuerySchema = z.object({
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
  category: z.enum(RESOURCE_CATEGORY_VALUES).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type AdminResourceCreateInput = z.infer<typeof adminResourceCreateSchema>;
export type AdminResourcePatchInput = z.infer<typeof adminResourcePatchSchema>;
