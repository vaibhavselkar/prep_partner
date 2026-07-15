// src/lib/memes/templates.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Template } from "@/lib/memes/types";

export function loadTemplates(dir = "assets/memes"): Template[] {
  const json = readFileSync(resolve(dir, "templates.json"), "utf8");
  return JSON.parse(json) as Template[];
}

export function getTemplate(id: string, dir = "assets/memes"): Template {
  const t = loadTemplates(dir).find((x) => x.id === id);
  if (!t) throw new Error(`unknown template: ${id}`);
  return t;
}
