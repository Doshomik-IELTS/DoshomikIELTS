import type { TestGenerationJob } from "@prisma/client";

function getBlueprintString(blueprint: unknown, key: string, fallback: string) {
  if (!blueprint || typeof blueprint !== "object") return fallback;
  const value = (blueprint as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function buildLocalGeneratedTest(job: TestGenerationJob) {
  const topic = getBlueprintString(job.blueprintJson, "topic", "everyday study habits");
  const difficulty = getBlueprintString(job.blueprintJson, "difficulty", "intermediate");
  const title = getBlueprintString(job.blueprintJson, "title", `Generated ${job.module} draft - ${topic}`);

  if (job.module === "reading") {
    return {
      title,
      description: `Local generated draft for review. Topic: ${topic}. Difficulty: ${difficulty}.`,
      type: job.testType,
      estimatedDurationMinutes: 20,
      sections: [
        {
          module: "reading",
          title: "Reading Passage 1",
          partNumber: 1,
          instructions: "Read the passage carefully and answer the questions.",
          durationMinutes: 20,
          contentJson: {
            kind: "reading_passage",
            ieltsVersion: "academic",
            passageTitle: `A passage about ${topic}`,
            passageText: `A\nResearchers and educators continue to study ${topic} because it affects how people learn, work, and make decisions.\n\nB\nOne important trend is that learners respond better when information is organised clearly and connected to realistic tasks.\n\nC\nHowever, experts warn that simple solutions rarely work for every context, so careful evaluation remains necessary.`,
            paragraphs: [
              { label: "A", text: `Researchers and educators continue to study ${topic} because it affects how people learn, work, and make decisions.` },
              { label: "B", text: "One important trend is that learners respond better when information is organised clearly and connected to realistic tasks." },
              { label: "C", text: "However, experts warn that simple solutions rarely work for every context, so careful evaluation remains necessary." },
            ],
            wordCount: 55,
            topicTags: [topic],
            sourcePolicy: { sourceType: "original", authorNote: "Locally generated placeholder draft.", copyrightChecked: true },
          },
          questions: [
            {
              questionType: "true_false_not_given",
              prompt: "Learners benefit when information is clearly organised.",
              optionsJson: { A: "True", B: "False", C: "Not Given" },
              difficulty,
              sourceSpanJson: { source: "reading_passage", reference: "Paragraph B", excerpt: "learners respond better when information is organised clearly" },
              answerKey: {
                canonicalAnswer: "A",
                scoringRuleJson: { rule: "single_choice" },
                explanation: "Paragraph B directly supports this statement.",
              },
            },
          ],
        },
      ],
    };
  }

  if (job.module === "listening") {
    return {
      title,
      description: `Local generated draft for review. Topic: ${topic}. Difficulty: ${difficulty}.`,
      type: job.testType,
      estimatedDurationMinutes: 8,
      sections: [
        {
          module: "listening",
          title: "Listening Part 1 - Conversation",
          partNumber: 1,
          instructions: "Listen carefully and answer the questions.",
          durationMinutes: 8,
          contentJson: {
            kind: "listening_script",
            partType: "conversation",
            setting: `A conversation about ${topic}`,
            speakers: [
              { id: "speaker_1", name: "Advisor", accent: "British" },
              { id: "speaker_2", name: "Student", accent: "International" },
            ],
            turns: [
              { speakerId: "speaker_1", text: `Today we are discussing ${topic} and how students can prepare effectively.` },
              { speakerId: "speaker_2", text: "I need a plan that is realistic and easy to follow." },
            ],
            transcript: `Advisor: Today we are discussing ${topic} and how students can prepare effectively.\nStudent: I need a plan that is realistic and easy to follow.`,
            audio: { mediaAssetId: null, durationSeconds: null, playOnceInStrictMode: true },
            sourcePolicy: { sourceType: "original", voiceSource: "tts", licenseChecked: true },
          },
          questions: [
            {
              questionType: "form_completion",
              prompt: "The student wants a plan that is realistic and ________.",
              difficulty,
              sourceSpanJson: { source: "listening_transcript", reference: "Transcript line 2", excerpt: "realistic and easy to follow" },
              answerKey: {
                canonicalAnswer: "easy to follow",
                scoringRuleJson: { maxWords: 3, ignorePunctuation: true, caseSensitive: false },
                explanation: "The student says the exact phrase in the second line.",
              },
            },
          ],
        },
      ],
    };
  }

  return {
    title,
    description: `Local generated ${job.module} draft for review. Topic: ${topic}. Difficulty: ${difficulty}.`,
    type: job.testType,
    estimatedDurationMinutes: job.module === "speaking" ? 5 : 20,
    sections: [
      {
        module: job.module,
        title: job.module === "speaking" ? "Speaking Part 1 - Interview" : "Writing Task 2 - Essay",
        partNumber: 1,
        instructions: job.module === "speaking" ? "Answer the examiner questions." : "Write your response.",
        durationMinutes: job.module === "speaking" ? 5 : 20,
        contentJson: {
          kind: job.module === "speaking" ? "speaking_set" : "writing_task",
          topicFamily: topic,
          prompt: `Describe your view on ${topic}.`,
          sourcePolicy: { sourceType: "original", copyrightChecked: true },
        },
        questions: [
          {
            questionType: job.module === "speaking" ? "speaking_part1" : "writing_task_2",
            prompt: job.module === "speaking" ? `Do you think ${topic} is important?` : `Some people believe ${topic} is increasingly important. To what extent do you agree?`,
            difficulty,
          },
        ],
      },
    ],
  };
}
