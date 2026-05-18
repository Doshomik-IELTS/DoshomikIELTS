import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRAPI_BASE_URL: z.string().min(1).optional(),
  STRAPI_API_TOKEN: z.string().min(1).optional(),
  LLM_PROVIDER: z.string().min(1).optional(),
  LLM_API_KEY: z.string().min(1).optional(),
});

export type ServerEnvValidation = ReturnType<typeof validateServerEnv>;

export function validateServerEnv(env: NodeJS.ProcessEnv = process.env) {
  return serverEnvSchema.safeParse(env);
}
