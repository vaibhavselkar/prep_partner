export type TeacherState = "teaching" | "checking" | "recap" | "done";

export function parseControlTag(text: string): {
  spoken: string;
  control: { state: TeacherState; topicDone: boolean } | null;
} {
  const m = text.match(/\n?\s*CONTROL:\s*(\{.*\})\s*$/s);
  if (!m) return { spoken: text.trim(), control: null };
  const spoken = text.slice(0, m.index).trim();
  try {
    const obj = JSON.parse(m[1]) as { state: TeacherState; topicDone: boolean };
    const states: TeacherState[] = ["teaching", "checking", "recap", "done"];
    if (!states.includes(obj.state) || typeof obj.topicDone !== "boolean") {
      return { spoken, control: null };
    }
    return { spoken, control: { state: obj.state, topicDone: obj.topicDone } };
  } catch {
    return { spoken, control: null };
  }
}
