import { z } from "zod";

export const profileFormSchema = z.object({
  name: z.string().max(120),
  targetBand: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || s === "" || (!Number.isNaN(Number(s)) && Number(s) >= 0 && Number(s) <= 9),
      { message: "Target band must be between 0 and 9." },
    ),
  examDate: z.string().max(32).optional(),
  nativeLanguage: z.string().max(80),
  studyGoal: z.string().max(500),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Body for `PATCH /api/profile` (matches `profileUpdateSchema`). */
export function profileFormToApiBody(values: ProfileFormValues) {
  const targetRaw = values.targetBand?.trim();
  const targetBand =
    targetRaw === undefined || targetRaw === ""
      ? null
      : Number.parseFloat(targetRaw);

  const exam = values.examDate?.trim();
  return {
    name: values.name.trim() || null,
    targetBand: Number.isFinite(targetBand) ? targetBand : null,
    examDate: exam ? exam : null,
    nativeLanguage: values.nativeLanguage.trim() || null,
    studyGoal: values.studyGoal.trim() || null,
  };
}

export function meResponseToFormDefaults(me: {
  name: string | null;
  targetBand: number | null;
  examDate: string | null;
  nativeLanguage: string | null;
  studyGoal: string | null;
}): ProfileFormValues {
  return {
    name: me.name ?? "",
    targetBand: me.targetBand != null ? String(me.targetBand) : "",
    examDate: me.examDate ? me.examDate.slice(0, 10) : "",
    nativeLanguage: me.nativeLanguage ?? "",
    studyGoal: me.studyGoal ?? "",
  };
}
