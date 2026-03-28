#!/usr/bin/env node
/**
 * Add worksheetPdf / answerKeyPdf from FRQ context HTML hrefs (in-site embeds).
 * Run: node tools/annotate-frq-pdfs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

function decodePath(href) {
  try {
    return decodeURIComponent(href.replace(/\+/g, " "));
  } catch {
    return href;
  }
}

function extractPdfHrefs(html) {
  if (!html || typeof html !== "string") return [];
  const out = [];
  const re = /href\s*=\s*"([^"]+\.pdf)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(decodePath(m[1]));
  }
  return out;
}

for (let n = 1; n <= 10; n++) {
  const fp = path.join(dataDir, `unit${n}.json`);
  if (!fs.existsSync(fp)) continue;
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  const bank = j.frqBank;
  if (!Array.isArray(bank)) continue;
  let touched = 0;
  for (const frq of bank) {
    const hrefs = extractPdfHrefs(frq.context);
    if (hrefs.length === 0) continue;
    const keyHrefs = hrefs.filter(h => /ANSWERS|SOLUTIONS/i.test(h));
    const sheetHrefs = hrefs.filter(h => !/ANSWERS|SOLUTIONS/i.test(h));
    if (!frq.worksheetPdf) frq.worksheetPdf = sheetHrefs[0] || hrefs[0];
    if (!frq.answerKeyPdf) frq.answerKeyPdf = keyHrefs[0] || (hrefs.length > 1 ? hrefs[1] : null);
    if (frq.context && /<a\s+href=/i.test(frq.context)) {
      const t = (frq.title || "Worksheet").replace(/</g, "");
      frq.context = `<p><strong>${t}</strong> — use the PDF viewer on the left. Toggle the <strong>Answer key</strong> panel on the right when you are ready to check your work (everything stays on this page).</p>`;
    }
    touched++;
  }
  if (touched) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
    console.log(`unit${n}.json: annotated ${touched} FRQ(s)`);
  }
}
console.log("Done.");
