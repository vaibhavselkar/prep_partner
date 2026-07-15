export function parseSpecs(modelText: string): unknown[] {
  const fence = modelText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : modelText;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) throw new Error("no JSON array found in model output");
  const arr = JSON.parse(candidate.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error("parsed value is not an array");
  return arr;
}
