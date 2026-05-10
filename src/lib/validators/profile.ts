import { z } from "zod";

/** HTML `type="date"` uses `YYYY-MM-DD`; ISO datetime strings are also accepted. */
const examDateInput = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.string().datetime()])
  .optional()
  .nullable();

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  targetBand: z.number().min(0).max(9).optional().nullable(),
  examDate: examDateInput,
  nativeLanguage: z.string().trim().max(80).optional().nullable(),
  studyGoal: z.string().trim().max(500).optional().nullable(),
});
