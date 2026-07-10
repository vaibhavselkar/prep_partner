import data from "@/data/syllabus-topics.json";

export interface SyllabusTopic {
  id: string;
  mr: string;
  en: string;
}

const TOPICS = data as Record<string, SyllabusTopic[]>;

// Granular topics for one subtopic (empty array if none defined, e.g. Mains Paper-2 sections).
export function topicsFor(subject: string, subtopic: string): SyllabusTopic[] {
  return TOPICS[`${subject}/${subtopic}`] ?? [];
}

// All topic ids belonging to a subject (across its subtopics).
export function subjectTopicIds(subjectKey: string): string[] {
  return Object.entries(TOPICS)
    .filter(([k]) => k.startsWith(subjectKey + "/"))
    .flatMap(([, v]) => v.map((t) => t.id));
}

export function allTopicIds(): string[] {
  return Object.values(TOPICS).flat().map((t) => t.id);
}
