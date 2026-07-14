export type ZoneStyle = "plain" | "impact";
export interface Zone {
  id: string;
  x: number; y: number; w: number; h: number;
  align: "left" | "center" | "right";
  valign: "top" | "center" | "bottom";
  color: string;
  style: ZoneStyle;
  fontSize: number;
}
export interface Template {
  id: string;
  file: string;      // basename under assets/memes/templates/
  width: number;
  height: number;
  zones: Zone[];
}
export interface FactAtom {
  sourceRef: string; // bank question id or note id
  subject: string;
  subtopic: string;
  fact: string;
}
export interface Digest {
  facts: FactAtom[];
  struggleThemes: string[];
}
export type Lang = "mr" | "en" | "mix";
export interface MemeSpec {
  id: string;
  subject: string;
  subtopic: string;
  template: string;                 // Template.id
  lang: Lang;
  zones: Record<string, string>;    // keyed by Template zone ids
  caption: string;                  // IG post caption (used in Phase 2)
  factLine?: string;                // present only for factual memes
  sourceRef?: string;               // required iff factLine present
  tag: string;
  altText: string;
}
export type MemeStatus = "pending" | "approved" | "rejected";
export interface MemeRecord extends MemeSpec {
  file: string;                     // png basename
  status: MemeStatus;
  createdAt: string;                // YYYY-MM-DD (passed in; no Date.now in lib)
  reviewedAt: string | null;
}
