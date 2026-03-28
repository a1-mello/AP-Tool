import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textToHtml(t) {
  const paras = String(t)
    .trim()
    .split(/\n\s*\n+/)
    .map(p => escapeHtml(p.replace(/\n/g, " ").replace(/\s+/g, " ").trim()))
    .filter(Boolean);
  return paras.length ? `<p>${paras.join("</p><p>")}</p>` : "<p>(See PDF.)</p>";
}

async function pdfText(filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return String(data.text || "").replace(/\r/g, "");
}

function isProblemPdf(name) {
  if (!/\.pdf$/i.test(name)) return false;
  if (/answer|solution/i.test(name)) return false;
  return true;
}

function findKeyPdf(dir, problemBase) {
  const candidates = [
    `${problemBase} ANSWERS.pdf`,
    `${problemBase} SOLUTIONS.pdf`,
    `${problemBase} ANSWER.pdf`
  ];
  for (const c of candidates) {
    const p = path.join(dir, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function splitProblems(text) {
  const t = text.replace(/\r/g, "");
  const re = /(?:^|\n)\s*(\d+)\.\)\s+/gm;
  const hits = [];
  let m;
  while ((m = re.exec(t)) !== null) {
    hits.push({ start: m.index, afterLabel: m.index + m[0].length, num: m[1] });
  }
  if (hits.length === 0) {
    const trimmed = t.trim();
    return trimmed.length ? [{ num: "1", body: trimmed.slice(0, 4000) }] : [];
  }
  return hits.map((h, i) => {
    const sliceStart = h.afterLabel;
    const sliceEnd = i + 1 < hits.length ? hits[i + 1].start : t.length;
    return { num: h.num, body: t.slice(sliceStart, sliceEnd).trim().slice(0, 3500) };
  });
}

function splitSubparts(body) {
  const chunks = body.split(/\n(?=\s*[a-z]\.\)\s+)/i);
  if (chunks.length <= 1) {
    return [{ label: "(a)", text: body.trim() }];
  }
  return chunks.map((ch, i) => {
    const mm = ch.match(/^\s*([a-z])\.\)\s*(.*)/is);
    if (mm) return { label: `(${mm[1]})`, text: mm[2].trim() };
    return { label: `(${String.fromCharCode(97 + i)})`, text: ch.trim() };
  });
}

async function buildFrqFromWorksheet(unitFolder, relDir, fileName, maxParts = 14) {
  const dir = path.join(ROOT, unitFolder, relDir);
  const full = path.join(dir, fileName);
  const base = fileName.replace(/\.pdf$/i, "");
  const keyPath = findKeyPdf(dir, base);
  let keyText = "";
  if (keyPath) {
    try {
      keyText = await pdfText(keyPath);
    } catch {
      keyText = "";
    }
  }
  const hasKey = keyText.replace(/\s/g, "").length > 400;
  const probText = await pdfText(full);
  if (probText.replace(/\s/g, "").length < 40) return null;

  const problems = splitProblems(probText);
  const relPdf = `${unitFolder}/${relDir}/${fileName}`.replace(/\\/g, "/");
  const parts = [];
  let pi = 0;
  outer: for (const prob of problems) {
    const subs = splitSubparts(prob.body);
    for (const sub of subs) {
      if (parts.length >= maxParts) break outer;
      const label = subs.length > 1 ? sub.label : `(${prob.num})`;
      parts.push({
        label,
        points: 2,
        question: textToHtml(sub.text),
        finalAnswer: hasKey
          ? escapeHtml(keyText.replace(/\s+/g, " ").trim().slice(0, 1200)) + (keyText.length > 1200 ? "…" : "")
          : "Use the answer key PDF in Materials (open the matching ANSWERS/SOLUTIONS file) or check with your teacher.",
        steps: hasKey
          ? ["Compare your work to the extracted key text above.", "Verify assumptions match the worksheet wording."]
          : ["Work the problem fully on paper.", "Confirm with the scanned key PDF when available."],
        scoring: "Full credit for correct reasoning and answer."
      });
      pi++;
    }
  }
  if (parts.length === 0) return null;

  return {
    title: base,
    calcAllowed: true,
    context: `<p><strong>${escapeHtml(base)}</strong> — Open the original worksheet: <a href="${escapeHtml(encodeURI(relPdf))}" target="_blank" rel="noopener noreferrer">PDF</a>${
      keyPath
        ? ` · <a href="${escapeHtml(encodeURI(`${unitFolder}/${relDir}/${path.basename(keyPath)}`.replace(/\\/g, "/")))}" target="_blank" rel="noopener noreferrer">Answer key</a>`
        : ""
    }.</p>`,
    parts
  };
}

async function importUnit(unitNum) {
  const unitFolder = `Unit ${unitNum}`;
  const unitPath = path.join(ROOT, unitFolder);
  if (!fs.existsSync(unitPath)) {
    console.log(`Skip ${unitFolder} (folder missing)`);
    return;
  }

  const jsonPath = path.join(DATA_DIR, `unit${unitNum}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.log(`Skip unit${unitNum}.json (missing)`);
    return;
  }

  const data = readJson(jsonPath);
  const existingTitles = new Set((data.frqBank || []).map(f => f.title));
  let nextId = (data.frqBank || []).reduce((m, f) => Math.max(m, typeof f.id === "number" ? f.id : 0), -1) + 1;

  const subdirs = fs.readdirSync(unitPath, { withFileTypes: true }).filter(d => d.isDirectory());
  const targets = subdirs.filter(d => {
    const n = d.name.trim().toLowerCase();
    return n === "homework" || n === "review";
  });

  let added = 0;
  for (const d of targets) {
    const relDir = d.name;
    const dir = path.join(unitPath, relDir);
    const files = fs.readdirSync(dir).filter(isProblemPdf);
    for (const f of files) {
      if (existingTitles.has(f.replace(/\.pdf$/i, ""))) continue;
      try {
        const frq = await buildFrqFromWorksheet(unitFolder, relDir, f);
        if (!frq) continue;
        if (existingTitles.has(frq.title)) continue;
        frq.id = nextId++;
        data.frqBank = data.frqBank || [];
        data.frqBank.push(frq);
        existingTitles.add(frq.title);
        added++;
        console.log(`  + FRQ: ${frq.title} (${frq.parts.length} parts)`);
      } catch (e) {
        console.warn(`  ! skip ${f}: ${e.message}`);
      }
    }
  }

  writeJson(jsonPath, data);
  console.log(`unit${unitNum}: added ${added} worksheet FRQ(s), total FRQs ${data.frqBank.length}`);
}

const units = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 10);
const toRun = units.length ? units : [1, 2, 3, 4, 5];

(async () => {
  for (const n of toRun) {
    console.log(`--- Unit ${n} ---`);
    await importUnit(n);
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
