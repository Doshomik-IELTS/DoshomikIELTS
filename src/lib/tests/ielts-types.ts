import type { IeltsModule } from "@prisma/client";

export const IELTS_MODULES: { value: IeltsModule; label: string; color: string }[] = [
  { value: "listening", label: "Listening", color: "text-purple-700" },
  { value: "reading", label: "Reading", color: "text-green-700" },
  { value: "writing", label: "Writing", color: "text-blue-700" },
  { value: "speaking", label: "Speaking", color: "text-orange-700" },
];

export const MODULE_DEFAULT_DURATION: Record<IeltsModule, number> = {
  listening: 30,
  reading: 60,
  writing: 60,
  speaking: 15,
};

export interface QuestionTypeOption {
  value: string;
  label: string;
  description: string;
}

export const MODULE_QUESTION_TYPES: Record<IeltsModule, QuestionTypeOption[]> = {
  listening: [
    { value: "multiple_choice_single", label: "Multiple Choice (single answer)", description: "Choose one from 4 options" },
    { value: "multiple_choice_multi", label: "Multiple Choice (multiple answers)", description: "Choose 2 or more from 4 options" },
    { value: "map_labeling", label: "Map / Plan Labeling", description: "Label locations on a map or diagram" },
    { value: "form_completion", label: "Form / Table Completion", description: "Fill in missing words in a form or table" },
    { value: "sentence_completion", label: "Sentence Completion", description: "Complete sentences with missing words" },
    { value: "short_answer", label: "Short Answer", description: "Write a short answer (1-3 words)" },
    { value: "matching", label: "Matching", description: "Match items from two columns" },
    { value: "true_false_not_given", label: "True / False / Not Given", description: "Classify statements" },
    { value: "diagram_label", label: "Diagram Labeling", description: "Label parts of a diagram" },
    { value: "flow_chart_completion", label: "Flow-chart Completion", description: "Complete a flow-chart" },
  ],
  reading: [
    { value: "multiple_choice_single", label: "Multiple Choice (single answer)", description: "Choose one from 4 options" },
    { value: "multiple_choice_multi", label: "Multiple Choice (multiple answers)", description: "Choose 2 or more from 4 options" },
    { value: "true_false_not_given", label: "True / False / Not Given", description: "Classify statements" },
    { value: "yes_no_not_given", label: "Yes / No / Not Given", description: "Classify statements for factual claims" },
    { value: "fill_blank", label: "Fill in the Blank", description: "Complete sentences with words from the passage" },
    { value: "sentence_completion", label: "Sentence Completion", description: "Complete sentences with missing words" },
    { value: "summary_completion", label: "Summary Completion", description: "Complete a summary with words from the passage" },
    { value: "matching", label: "Matching Headings / Information", description: "Match items to descriptions" },
    { value: "diagram_label", label: "Diagram Labeling", description: "Label parts of a diagram" },
    { value: "flow_chart_completion", label: "Flow-chart Completion", description: "Complete a flow-chart" },
    { value: "table_completion", label: "Table Completion", description: "Fill in a table with missing information" },
    { value: "note_completion", label: "Notes / Summary / Sentence Completion", description: "Complete notes or summary with missing words" },
    { value: "short_answer", label: "Short Answer", description: "Write a short answer (1-3 words)" },
  ],
  writing: [
    { value: "writing_task_1", label: "Task 1 — Academic", description: "Describe visual information (graph, chart, diagram, table)" },
    { value: "writing_task_2", label: "Task 1 — General Training", description: "Write a letter in a formal or semi-formal style" },
    { value: "writing_task_2", label: "Task 2 — Essay", description: "Write an essay in response to an argument or problem" },
  ],
  speaking: [
    { value: "speaking_part1", label: "Part 1 — Introduction & Interview", description: "Answer questions about familiar topics" },
    { value: "speaking_part2", label: "Part 2 — Long Turn (Cue Card)", description: "Speak for 1-2 minutes on a given topic" },
    { value: "speaking_part3", label: "Part 3 — Discussion", description: "Discuss ideas or issues in depth" },
  ],
};

export const DIFFICULTY_OPTIONS = [
  { value: "basic", label: "Easy" },
  { value: "intermediate", label: "Medium" },
  { value: "advanced", label: "Hard" },
] as const;

export function getDefaultOptionsForType(questionType: string): Record<string, string> | null {
  switch (questionType) {
    case "multiple_choice_single":
    case "multiple_choice_multi":
      return { A: "", B: "", C: "", D: "" };
    case "true_false_not_given":
    case "yes_no_not_given":
      return { True: "True", False: "False", Not_Given: "Not Given" };
    case "map_labeling":
    case "diagram_label":
      return { "1": "", "2": "", "3": "", "4": "", "5": "" };
    default:
      return null;
  }
}

export function getReadingInstructions(module: IeltsModule): string {
  switch (module) {
    case "reading":
      return "Read the passage carefully and answer the questions. Write your answers in the spaces provided.";
    case "listening":
      return "Listen carefully and answer the questions. You will hear the audio only once.";
    case "writing":
      return "Write your answer in the space provided. Aim for at least 150 words for Task 1 and 250 words for Task 2.";
    case "speaking":
      return "Answer the questions clearly and in detail.";
    default:
      return "";
  }
}