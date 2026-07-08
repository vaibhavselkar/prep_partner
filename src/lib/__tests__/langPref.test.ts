import { describe, it, expect } from "vitest";
import { pickLang, pickOption, pickLangMultiline, prefToLanguage } from "@/lib/langPref";

describe("pickLang", () => {
  const q = "महाराष्ट्राची राजधानी कोणती? / What is the capital of Maharashtra?";
  it("returns full text for 'both'", () => {
    expect(pickLang(q, "both")).toBe(q);
  });
  it("returns only Marathi side for 'mr'", () => {
    expect(pickLang(q, "mr")).toBe("महाराष्ट्राची राजधानी कोणती?");
  });
  it("returns only English side for 'en'", () => {
    expect(pickLang(q, "en")).toBe("What is the capital of Maharashtra?");
  });
  it("returns full text when there is no ' / ' separator", () => {
    expect(pickLang("संधी म्हणजे काय?", "en")).toBe("संधी म्हणजे काय?");
  });
  it("keeps English side intact when it contains a slash date", () => {
    expect(pickLang("अर्ज / Apply by 17/07/2026", "en")).toBe("Apply by 17/07/2026");
  });
});

describe("pickOption", () => {
  it("preserves the letter prefix and picks the chosen language", () => {
    const opt = "A. मुंबई / Mumbai";
    expect(pickOption(opt, "en")).toBe("A. Mumbai");
    expect(pickOption(opt, "mr")).toBe("A. मुंबई");
    expect(pickOption(opt, "both")).toBe(opt);
    // letter (used for answer matching) is unaffected by display transform
    expect(pickOption(opt, "en")[0]).toBe("A");
  });
});

describe("pickLangMultiline", () => {
  it("splits each line independently", () => {
    const md = "# शीर्षक / Title\n- गोदावरी / Godavari river";
    expect(pickLangMultiline(md, "en")).toBe("# Title\n- Godavari river");
    expect(pickLangMultiline(md, "mr")).toBe("# शीर्षक\n- गोदावरी");
  });
});

describe("prefToLanguage", () => {
  it("maps preference to the bank language filter", () => {
    expect(prefToLanguage("mr")).toBe("marathi");
    expect(prefToLanguage("en")).toBe("english");
    expect(prefToLanguage("both")).toBe("bilingual");
  });
});
