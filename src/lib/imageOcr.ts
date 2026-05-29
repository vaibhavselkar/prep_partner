import { getGroqClient } from "./groq";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
  pageHint?: number
): Promise<string> {
  const groq = getGroqClient();
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const pageLabel = pageHint ? ` (page ${pageHint})` : "";

  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
          {
            type: "text",
            text: `This is a scanned handwritten notebook page${pageLabel} in Marathi (Devanagari script).
Please transcribe ALL the text you can see in this image exactly as written, preserving the original Marathi/Devanagari text.
Include headings, bullet points, numbered lists, and any diagrams described as text.
If there are drawings or diagrams, describe them briefly in [brackets].
Output ONLY the transcribed content, nothing else.`,
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  return response.choices[0].message.content ?? "";
}
