import type { MemeSpec, Template, Zone } from "@/lib/memes/types";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function zoneCss(z: Zone): string {
  const justify = z.align === "left" ? "flex-start" : z.align === "right" ? "flex-end" : "center";
  const items = z.valign === "top" ? "flex-start" : z.valign === "bottom" ? "flex-end" : "center";
  const impact = z.style === "impact"
    ? "text-transform:uppercase;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke fill;font-family:'Anton','Arial Black',sans-serif;"
    : `color:${z.color};font-family:'NotoDeva','Nirmala UI','Segoe UI',sans-serif;`;
  return `position:absolute;left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px;` +
    `display:flex;justify-content:${justify};align-items:${items};text-align:${z.align};` +
    `font-size:${z.fontSize}px;font-weight:800;line-height:1.18;padding:8px;box-sizing:border-box;${impact}`;
}

export function composeHtml(
  spec: MemeSpec,
  tpl: Template,
  opts: { imageBaseUrl?: string; fontPath?: string } = {},
): string {
  const base = opts.imageBaseUrl ?? "http://localhost:8791";
  const fontFace = opts.fontPath
    ? `@font-face{font-family:'NotoDeva';src:url('${opts.fontPath}');font-weight:400 900;}`
    : "";
  const zones = tpl.zones.map((z) => `<div style="${zoneCss(z)}">${esc(spec.zones[z.id] ?? "")}</div>`).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    ${fontFace}
    html,body{width:${tpl.width}px;height:${tpl.height}px;overflow:hidden;}
    body{position:relative;}
    img.bg{position:absolute;inset:0;width:${tpl.width}px;height:${tpl.height}px;display:block;}
  </style></head><body>
    <img class="bg" src="${base}/${tpl.file}" alt="">
    ${zones}
  </body></html>`;
}
