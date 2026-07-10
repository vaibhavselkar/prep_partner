import { PRELIMS_SUBJECTS } from "@/lib/syllabus";
import { topicsFor, type SyllabusTopic } from "@/lib/syllabusTopics";

export const PLAN_DAYS = 30;

// Study order for the one-month Prelims plan (concept-heavy subjects first).
const ORDER = ["history", "geography", "polity", "economy", "science", "arithmetic", "reasoning", "current_affairs"];

export interface PlanItem {
  subject: string;
  subtopic: string;
  topic: SyllabusTopic;
}

// All Prelims topics in a study-friendly order (subject by subject).
export function orderedPrelimsItems(): PlanItem[] {
  const items: PlanItem[] = [];
  for (const key of ORDER) {
    const subj = PRELIMS_SUBJECTS.find((s) => s.key === key);
    if (!subj) continue;
    for (const st of subj.subtopics) {
      for (const t of topicsFor(subj.key, st.key)) {
        items.push({ subject: subj.key, subtopic: st.key, topic: t });
      }
    }
  }
  return items;
}

// Split the ordered topics into `days` balanced buckets (consecutive topics stay together).
export function buildDailyPlan(days = PLAN_DAYS): PlanItem[][] {
  const items = orderedPrelimsItems();
  const total = items.length;
  const buckets: PlanItem[][] = Array.from({ length: days }, () => []);
  if (total === 0) return buckets;
  items.forEach((it, i) => {
    const d = Math.min(days - 1, Math.floor((i * days) / total));
    buckets[d].push(it);
  });
  return buckets;
}

// Which plan-day is it today, given the stored start date (clamped to 1..PLAN_DAYS)?
export function dayIndexFrom(startISODate: string, now: Date): number {
  const [y, m, d] = startISODate.split("-").map(Number);
  const startMid = new Date(y, (m || 1) - 1, d || 1).getTime();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.floor((nowMid - startMid) / 86_400_000);
  return Math.min(PLAN_DAYS, Math.max(1, diff + 1));
}
