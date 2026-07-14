// scripts/memes/fetch-templates.ts
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { Template } from "../../src/lib/memes/types.ts";

const TPL_DIR = "assets/memes/templates";
const FONT_DIR = "assets/fonts";

const IMAGES: Record<string, string> = {
  drake: "https://i.imgflip.com/30b1gx.jpg",
  "two-buttons": "https://i.imgflip.com/1g8my4.jpg",
  "distracted-boyfriend": "https://i.imgflip.com/1ur9b0.jpg",
  "expanding-brain": "https://i.imgflip.com/1jwhww.jpg",
  "change-my-mind": "https://i.imgflip.com/24y43o.jpg",
  "gru-plan": "https://i.imgflip.com/26jxvz.jpg",
};

const FONT_URL =
  "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf";

const TEMPLATES: Template[] = [
  { id: "drake", file: "drake.jpg", width: 1200, height: 1200, zones: [
    { id: "reject",  x: 640, y: 20,  w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
    { id: "approve", x: 640, y: 620, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
  ]},
  { id: "two-buttons", file: "two-buttons.jpg", width: 600, height: 908, zones: [
    { id: "left",  x: 60,  y: 60, w: 210, h: 150, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 26 },
    { id: "right", x: 300, y: 20, w: 230, h: 150, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 26 },
    { id: "who",   x: 20,  y: 720, w: 560, h: 170, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
  ]},
  { id: "distracted-boyfriend", file: "distracted-boyfriend.jpg", width: 1200, height: 800, zones: [
    { id: "girlfriend", x: 820, y: 380, w: 300, h: 180, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
    { id: "man",        x: 470, y: 470, w: 260, h: 160, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
    { id: "other",      x: 120, y: 250, w: 260, h: 180, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
  ]},
  { id: "expanding-brain", file: "expanding-brain.jpg", width: 857, height: 1202, zones: [
    { id: "p1", x: 20, y: 20,  w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p2", x: 20, y: 320, w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p3", x: 20, y: 620, w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p4", x: 20, y: 920, w: 420, h: 260, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
  ]},
  { id: "change-my-mind", file: "change-my-mind.jpg", width: 482, height: 361, zones: [
    { id: "sign", x: 150, y: 210, w: 300, h: 90, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 22 },
  ]},
  { id: "gru-plan", file: "gru-plan.jpg", width: 700, height: 707, zones: [
    { id: "s1", x: 20,  y: 10,  w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s2", x: 360, y: 10,  w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s3", x: 20,  y: 360, w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s4", x: 360, y: 360, w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
  ]},
];

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log("saved", dest);
}

async function main() {
  await mkdir(TPL_DIR, { recursive: true });
  await mkdir(FONT_DIR, { recursive: true });
  for (const [id, url] of Object.entries(IMAGES)) {
    const dest = `${TPL_DIR}/${id}.jpg`;
    if (existsSync(dest)) { console.log("skip", dest); continue; }
    await download(url, dest);
  }
  const font = `${FONT_DIR}/NotoSansDevanagari-Bold.ttf`;
  if (!existsSync(font)) await download(FONT_URL, font);
  await writeFile("assets/memes/templates.json", JSON.stringify(TEMPLATES, null, 2));
  console.log("wrote templates.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
