import { describe, it, expect } from "vitest";
import { parseControlTag } from "@/lib/shikvani/controlTag";

describe("parseControlTag", () => {
  it("parses a trailing CONTROL line and strips it from spoken text", () => {
    const raw = 'शिवाजी महाराज... समजलं का?\nCONTROL: {"state":"checking","topicDone":false}';
    const { spoken, control } = parseControlTag(raw);
    expect(control).toEqual({ state: "checking", topicDone: false });
    expect(spoken).toBe("शिवाजी महाराज... समजलं का?");
    expect(spoken).not.toMatch(/CONTROL/);
  });
  it("marks topicDone true", () => {
    const { control } = parseControlTag('छान!\nCONTROL: {"state":"done","topicDone":true}');
    expect(control).toEqual({ state: "done", topicDone: true });
  });
  it("returns null control and original text when no tag", () => {
    const { spoken, control } = parseControlTag("just teaching, no tag");
    expect(control).toBeNull();
    expect(spoken).toBe("just teaching, no tag");
  });
  it("ignores an invalid tag payload", () => {
    const { control } = parseControlTag("hi\nCONTROL: not-json");
    expect(control).toBeNull();
  });
});
