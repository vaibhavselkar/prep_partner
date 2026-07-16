import { SYLLABUS } from "@/lib/syllabus";
import { topicsFor } from "@/lib/syllabusTopics";

export interface TeachingTopic {
  id: string;
  mr: string;
  en: string;
  subject: string;
  subtopic: string;
}

export function orderedTopics(): TeachingTopic[] {
  const out: TeachingTopic[] = [];
  for (const subject of SYLLABUS) {
    for (const sub of subject.subtopics) {
      for (const t of topicsFor(subject.key, sub.key)) {
        out.push({ id: t.id, mr: t.mr, en: t.en, subject: subject.key, subtopic: sub.key });
      }
    }
  }
  return out;
}

export function nextTopic(done: Set<string>): TeachingTopic | null {
  return orderedTopics().find((t) => !done.has(t.id)) ?? null;
}
