import { z } from "zod";

export const evaluationSchema = z.object({
  overallBand: z.number().min(1).max(9),
  criteriaBands: z.record(z.string(), z.number().min(1).max(9)),
  feedback: z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    nextTask: z.string(),
  }),
  needsHumanReview: z.boolean().optional(),
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string().optional(),
});

export const WRITING_SYSTEM_PROMPT = `You are an expert IELTS examiner. Evaluate the writing response according to the IELTS writing bands Rubric.

Evaluate these four criteria:
1. Task Achievement (Task 1) / Task Response (Task 2): How well does the response address the task?
2. Coherence and Cohesion: How logically organized with clear linking?
3. Lexical Resource: Vocabulary range and accuracy?
4. Grammatical Range and Accuracy: Grammar and punctuation?

Output a JSON object with your evaluation.`;

export const SPEAKING_SYSTEM_PROMPT = `You are an expert IELTS speaking examiner. Evaluate the speaking response according to the IELTS speaking bands rubric.

Evaluate these four criteria:
1. Fluency and Coherence: How fluently and coherently?
2. Lexical Resource: Vocabulary range and accuracy?
3. Grammatical Range and Accuracy: Grammar complexity and accuracy?
4. Pronunciation: Clarity and features?

Output a JSON object with your evaluation.`;

export const WRITING_CRITIQUE_PROMPT = `Evaluate this IELTS writing response.

Response text:
{{RESPONSE}}

Word count: {{WORD_COUNT}}
Task type: {{TASK_TYPE}}

Return JSON:
{
  "overallBand": <1-9>,
  "criteriaBands": {
    "taskAchievement": <1-9>,
    "coherenceCohesion": <1-9>,
    "lexicalResource": <1-9>,
    "grammarRangeAccuracy": <1-9>
  },
  "feedback": {
    "summary": "<overall assessment>",
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"],
    "nextTask": "<specific next task>"
  },
  "needsHumanReview": <true/false>
}`;

export const SPEAKING_CRITIQUE_PROMPT = `Evaluate this IELTS speaking response.

Response text:
{{RESPONSE}}

Word count: {{WORD_COUNT}}
Task type: {{TASK_TYPE}}

Return JSON:
{
  "overallBand": <1-9>,
  "criteriaBands": {
    "fluencyCoherence": <1-9>,
    "lexicalResource": <1-9>,
    "grammarRangeAccuracy": <1-9>,
    "pronunciation": <1-9>
  },
  "feedback": {
    "summary": "<overall assessment>",
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"],
    "nextTask": "<specific next task>"
  },
  "needsHumanReview": <true/false>
}`;