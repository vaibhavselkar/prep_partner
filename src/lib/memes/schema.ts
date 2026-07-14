import type { Digest, MemeSpec, Template } from "@/lib/memes/types";

export function validateSpec(
  spec: unknown,
  ctx: { digest: Digest; templates: Template[] },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const s = spec as Partial<MemeSpec>;
  const reqStr: (keyof MemeSpec)[] = ["id", "subject", "subtopic", "template", "caption", "tag", "altText"];
  for (const k of reqStr) if (typeof s[k] !== "string" || !(s[k] as string).length) errors.push(`missing/empty field: ${k}`);
  if (!["mr", "en", "mix"].includes(s.lang as string)) errors.push(`invalid lang: ${s.lang}`);

  const tpl = ctx.templates.find((t) => t.id === s.template);
  if (!tpl) {
    errors.push(`unknown template: ${s.template}`);
  } else {
    const zoneIds = new Set(tpl.zones.map((z) => z.id));
    const given = s.zones ?? {};
    for (const id of Object.keys(given)) if (!zoneIds.has(id)) errors.push(`zone id not on template: ${id}`);
    for (const id of zoneIds) if (typeof given[id] !== "string" || !given[id].length) errors.push(`missing zone text: ${id}`);
  }

  if (s.factLine && !s.sourceRef) errors.push("factLine present without sourceRef");
  if (s.sourceRef && !ctx.digest.facts.some((f) => f.sourceRef === s.sourceRef)) {
    errors.push(`sourceRef not in digest: ${s.sourceRef}`);
  }
  return { ok: errors.length === 0, errors };
}
