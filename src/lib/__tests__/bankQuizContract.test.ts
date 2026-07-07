import { describe, it, expect } from "vitest";
import { buildBankQuiz } from "@/app/api/bank-quiz/route";

describe("buildBankQuiz", () => {
  it("clamps count to 1..50 and returns questions", () => {
    const res = buildBankQuiz({ count: 999 });
    expect(res.requested).toBe(50);
    expect(res.questions.length).toBeLessThanOrEqual(50);
  });
  it("defaults count to 5", () => {
    expect(buildBankQuiz({}).requested).toBe(5);
  });
});
