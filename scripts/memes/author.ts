import { spawn } from "node:child_process";
import { buildAuthorPrompt } from "../../src/lib/memes/prompt.ts";
import { parseSpecs } from "../../src/lib/memes/parse.ts";
import { validateSpec } from "../../src/lib/memes/schema.ts";
import type { Digest, MemeSpec, Template } from "../../src/lib/memes/types.ts";

export type ModelRunner = (prompt: string) => Promise<string>;

export function claudeRunner(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", "--output-format", "text"], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}`))));
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function keepValid(raw: unknown[], ctx: { digest: Digest; templates: Template[] }): { specs: MemeSpec[]; errors: string[] } {
  const specs: MemeSpec[] = [];
  const errors: string[] = [];
  for (const r of raw) {
    const v = validateSpec(r, ctx);
    if (v.ok) specs.push(r as MemeSpec);
    else errors.push(...v.errors);
  }
  return { specs, errors };
}

export async function authorSpecs(
  ctx: { digest: Digest; templates: Template[]; count: number; langMix: string },
  run: ModelRunner = claudeRunner,
): Promise<MemeSpec[]> {
  const prompt = buildAuthorPrompt(ctx);
  const attempt = async (p: string) => {
    try { return keepValid(parseSpecs(await run(p)), ctx); }
    catch (e) { return { specs: [] as MemeSpec[], errors: [String(e)] }; }
  };
  let res = await attempt(prompt);
  if (res.specs.length === 0) {
    const fix = `${prompt}\n\nYOUR PREVIOUS OUTPUT WAS INVALID. Fix these and output ONLY the JSON array:\n- ${res.errors.slice(0, 10).join("\n- ")}`;
    res = await attempt(fix);
  }
  if (res.specs.length === 0) console.warn("[author] no valid specs after retry:", res.errors.slice(0, 5));
  return res.specs;
}
