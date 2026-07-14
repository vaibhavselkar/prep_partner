import type { Digest, Template } from "@/lib/memes/types";

export function buildAuthorPrompt(ctx: { digest: Digest; templates: Template[]; count: number; langMix: string }): string {
  const { digest, templates, count, langMix } = ctx;
  const facts = digest.facts.map((f) => `- [${f.sourceRef}] (${f.subject}/${f.subtopic}) ${f.fact}`).join("\n");
  const tpls = templates.map((t) => `- ${t.id}: zones = [${t.zones.map((z) => z.id).join(", ")}]`).join("\n");
  return `You are a witty Marathi+English meme writer for MPSC Group-C exam aspirants.
Write ${count} memes as a JSON array of MemeSpec objects. Output ONLY the JSON array.

LANGUAGE MIX: ${langMix} — mix pure-Marathi, pure-English, and Marathi-English ("Minglish") memes. Humor-forward, a few motivational. Keep captions short and punchy.

TRUST RULE: If a meme states a factual claim, it MUST use only facts from the DIGEST below, and set "factLine" to that fact and "sourceRef" to its [id]. Relatable study-struggle memes need no fact and omit factLine/sourceRef. Never invent facts.

TEMPLATES (pick one per meme; fill EVERY listed zone id):
${tpls}

DIGEST (the only allowed facts):
${facts}

STRUGGLE THEMES (for relatable memes): ${digest.struggleThemes.join(", ")}

Each MemeSpec: { "id": kebab-unique, "subject", "subtopic", "template": one id above, "lang": "mr"|"en"|"mix", "zones": { <every zone id>: text }, "caption": Instagram caption with emojis, "tag": hashtags, "altText": description, and for factual memes also "factLine" + "sourceRef" }.`;
}
