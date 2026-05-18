export const DEV_AUTH = {
  email: process.env.DEV_LEARNER_EMAIL ?? "demo@ieltspp.local",
  password: process.env.DEV_LEARNER_PASSWORD ?? "",
  name: process.env.DEV_LEARNER_NAME ?? "Demo Learner",
  targetBand: parseFloat(process.env.DEV_LEARNER_TARGET_BAND ?? "6.5"),
  examDate: process.env.DEV_LEARNER_EXAM_DATE ?? "2026-12-31",
  nativeLanguage: process.env.DEV_LEARNER_NATIVE_LANGUAGE ?? "Bangla",
  studyGoal: process.env.DEV_LEARNER_STUDY_GOAL ?? "Reach IELTS 6.5+ with strong foundations",
};

export const DEV_ADMIN_AUTH = {
  email: process.env.DEV_ADMIN_EMAIL ?? "admin@ieltspp.local",
  password: process.env.DEV_ADMIN_PASSWORD ?? "",
  name: process.env.DEV_ADMIN_NAME ?? "Demo Admin",
  targetBand: parseFloat(process.env.DEV_ADMIN_TARGET_BAND ?? "7.0"),
  examDate: process.env.DEV_ADMIN_EXAM_DATE ?? "2026-06-30",
  nativeLanguage: process.env.DEV_ADMIN_NATIVE_LANGUAGE ?? "English",
  studyGoal: process.env.DEV_ADMIN_STUDY_GOAL ?? "Admin access for testing",
};
