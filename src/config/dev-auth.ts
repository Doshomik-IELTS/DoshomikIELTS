function requireEnv(name: string, fallback: string) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") return fallback;
    throw new Error(`${name} is required in development. Set it in .env.local.`);
  }
  return value;
}

export const DEV_AUTH = {
  email: process.env.DEV_LEARNER_EMAIL ?? "demo@doshomikielts.local",
  password: requireEnv("DEV_LEARNER_PASSWORD", "dev-learner-change-me"),
  name: process.env.DEV_LEARNER_NAME ?? "Demo Learner",
  targetBand: parseFloat(process.env.DEV_LEARNER_TARGET_BAND ?? "6.5"),
  examDate: process.env.DEV_LEARNER_EXAM_DATE ?? "2026-12-31",
  nativeLanguage: process.env.DEV_LEARNER_NATIVE_LANGUAGE ?? "Bangla",
  studyGoal: process.env.DEV_LEARNER_STUDY_GOAL ?? "Reach IELTS 6.5+ with strong foundations",
};

export const DEV_ADMIN_AUTH = {
  email: process.env.DEV_ADMIN_EMAIL ?? "admin@doshomikielts.local",
  password: requireEnv("DEV_ADMIN_PASSWORD", "dev-admin-change-me"),
  name: process.env.DEV_ADMIN_NAME ?? "Demo Admin",
  targetBand: parseFloat(process.env.DEV_ADMIN_TARGET_BAND ?? "7.0"),
  examDate: process.env.DEV_ADMIN_EXAM_DATE ?? "2026-06-30",
  nativeLanguage: process.env.DEV_ADMIN_NATIVE_LANGUAGE ?? "English",
  studyGoal: process.env.DEV_ADMIN_STUDY_GOAL ?? "Admin access for testing",
};
