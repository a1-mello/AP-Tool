/**
 * Bulk-import MCQs + FRQs from homework/review PDFs.
 *
 * Usage:
 *   node tools/bulk-packet-import.mjs              # units 1–10 (skip missing folders)
 *   node tools/bulk-packet-import.mjs 3 4        # only these units
 *   node tools/bulk-packet-import.mjs --replace  # drop prior packetAuto items first
 *
 * Requires: pdf-parse (npm install)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

const MAX_MCQ_PER_UNIT = 900;
const MAX_FRQ_PER_UNIT = 400;
const MIN_KEY_SNIPPET = 25;
const MAX_KEY_SNIPPET = 220;
const PROBLEM_BODY_MAX = 520;

const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
const FLAGS = new Set(process.argv.slice(2).filter(a => a.startsWith("--")));

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
    `${problemBase} ANSWER.pdf`,
    `${problemBase} answers.pdf`,
    `${problemBase} solutions.pdf`
  ];
  for (const c of candidates) {
    const p = path.join(dir, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function listPdfDirs(unitPath) {
  const out = [];
  for (const ent of fs.readdirSync(unitPath, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const norm = ent.name.trim().toLowerCase();
    if (norm === "homework" || norm === "review") out.push(ent.name);
  }
  return out;
}

function pickNearestSection(unitNum, minor, allowedSections) {
  const allowed = [...allowedSections].sort((a, b) => {
    const na = Number(a.split(".")[1] || 0);
    const nb = Number(b.split(".")[1] || 0);
    return na - nb;
  });
  const candidate = `${unitNum}.${minor}`;
  if (allowed.includes(candidate)) return candidate;
  const nums = allowed.map(s => {
    const p = s.split(".");
    return { s, n: Number(p[1]) || 0 };
  });
  let best = allowed[0] || `${unitNum}.1`;
  let bestD = Infinity;
  for (const { s, n } of nums) {
    const d = Math.abs(n - minor);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/** Map worksheet filename to a section string in unit JSON (e.g. 3.2). */
function inferSection(fileName, unitNum, allowedSections) {
  const base = fileName.replace(/\.pdf$/i, "");
  const allowed = allowedSections.length ? allowedSections : [`${unitNum}.1`];

  const m = base.match(/(\d+)\s*-\s*(\d+)/);
  if (m && Number(m[1]) === unitNum) {
    return pickNearestSection(unitNum, Number(m[2]), allowed);
  }

  if (/review/i.test(base)) return allowed[allowed.length - 1] || `${unitNum}.1`;
  return allowed[0] || `${unitNum}.1`;
}

function inferSectionFromFrqTitle(title, unitNum, allowedSections) {
  const allowed = allowedSections.length ? allowedSections : [`${unitNum}.1`];
  const m = String(title || "").match(/^(\d+)\s*-\s*(\d+)/);
  if (m && Number(m[1]) === unitNum) {
    return pickNearestSection(unitNum, Number(m[2]), allowed);
  }
  if (/review/i.test(title)) return allowed[allowed.length - 1] || `${unitNum}.1`;
  return null;
}

function splitProblems(text) {
  const t = text.replace(/\r/g, "");
  const markers = [];
  const res = [
    /(?:^|\n)\s*(?:_{2,12}\s*)?(\d+)\.\)\s+/gm,
    /(?:^|\n)\s*(?:_{2,12}\s*)?(\d+)\.\s+(?=[A-Za-z(❑□√∫∑])/gm,
    /(?:^|\n)\s*(\d+)\)\s+/gm,
    /(?:^|\n)\s*Question\s+(\d+)[:.\s]/gim
  ];
  for (const re of res) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(t)) !== null) {
      markers.push({ start: m.index, after: m.index + m[0].length, num: m[1] });
    }
  }
  markers.sort((a, b) => a.start - b.start);
  const uniq = [];
  for (const mk of markers) {
    if (uniq.length && mk.start < uniq[uniq.length - 1].after) continue;
    uniq.push(mk);
  }
  if (uniq.length === 0) {
    const trimmed = t.trim();
    return trimmed.length > 30 ? [{ num: "1", body: trimmed.slice(0, 4000) }] : [];
  }
  return uniq.map((h, i) => {
    const sliceEnd = i + 1 < uniq.length ? uniq[i + 1].start : t.length;
    return { num: h.num, body: t.slice(h.after, sliceEnd).trim().slice(0, 4000) };
  });
}

function cleanSnippet(s) {
  let x = String(s)
    .replace(/\s+/g, " ")
    .replace(/Created by[^.]{0,80}\./gi, "")
    .trim();
  if (x.length > MAX_KEY_SNIPPET) x = x.slice(0, MAX_KEY_SNIPPET) + "…";
  return x;
}

function pickDistractors(correct, pool, need = 3) {
  const out = [];
  const cLow = correct.toLowerCase();
  for (const p of pool) {
    if (!p || p.length < 8) continue;
    if (p.toLowerCase() === cLow) continue;
    if (out.includes(p)) continue;
    out.push(p.slice(0, MAX_KEY_SNIPPET));
    if (out.length >= need) break;
  }
  const fallbacks = [
    "0",
    "The limit does not exist.",
    "The expression is undefined at that point.",
    "f′(x) = 0 for all x in the interval.",
    "Apply the quotient rule without simplifying the numerator.",
    "Use only the left-hand limit to decide."
  ];
  let fi = 0;
  while (out.length < need) {
    out.push(fallbacks[fi % fallbacks.length]);
    fi++;
  }
  return out.slice(0, need);
}

function shuffleAssign(correctText, distractors) {
  const items = [{ text: correctText, ok: true }, ...distractors.map(text => ({ text, ok: false }))];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const letters = ["A", "B", "C", "D"];
  const choices = {};
  let correctLetter = "A";
  items.forEach((it, idx) => {
    choices[letters[idx]] = it.text;
    if (it.ok) correctLetter = letters[idx];
  });
  return { choices, correct: correctLetter };
}

function splitSubparts(body) {
  const chunks = body.split(/\n(?=\s*[a-z]\.\)\s+)/i);
  if (chunks.length <= 1) return [{ label: "a", text: body.trim() }];
  return chunks.map((ch, i) => {
    const mm = ch.match(/^\s*([a-z])\.\)\s*(.*)/is);
    if (mm) return { label: mm[1], text: mm[2].trim() };
    return { label: String.fromCharCode(97 + i), text: ch.trim() };
  });
}

function shortId(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

async function processPdf(unitNum, unitFolder, relDir, fileName, data, state) {
  if (state.mcqCount >= MAX_MCQ_PER_UNIT && state.frqCount >= MAX_FRQ_PER_UNIT) return;

  const dir = path.join(ROOT, unitFolder, relDir);
  const full = path.join(dir, fileName);
  const base = fileName.replace(/\.pdf$/i, "");
  const section = inferSection(fileName, unitNum, data.sections || [`${unitNum}.1`]);
  const relPdf = `${unitFolder}/${relDir}/${fileName}`.replace(/\\/g, "/");

  let probText;
  try {
    probText = await pdfText(full);
  } catch {
    return;
  }
  if (probText.replace(/\s/g, "").length < 35) return;

  const keyPath = findKeyPdf(dir, base);
  let keyText = "";
  if (keyPath) {
    try {
      keyText = await pdfText(keyPath);
    } catch {
      keyText = "";
    }
  }
  const keyProblems = splitProblems(keyText);
  const keySnips = keyProblems.map(p => cleanSnippet(p.body)).filter(s => s.length >= MIN_KEY_SNIPPET);

  const problems = splitProblems(probText);
  const poolForDistractors = [...keySnips];

  for (const prob of problems) {
    if (state.mcqCount >= MAX_MCQ_PER_UNIT) break;
    const subs = splitSubparts(prob.body);
    for (const sub of subs) {
      if (state.mcqCount >= MAX_MCQ_PER_UNIT) break;
      const stem = sub.text.replace(/\s+/g, " ").trim();
      if (stem.length < 20) continue;

      const stemShort = stem.slice(0, PROBLEM_BODY_MAX);
      const idx = Math.min(Number(prob.num) - 1, Math.max(0, keySnips.length - 1));
      let correctLine =
        keySnips.length > 0 && keySnips[idx] && keySnips[idx].length >= MIN_KEY_SNIPPET
          ? keySnips[idx]
          : "";

      if (!correctLine || correctLine.length < MIN_KEY_SNIPPET) {
        correctLine =
          "Work this item on paper, then check the official answer key PDF for this worksheet (Materials).";
      }

      const distPool = poolForDistractors.filter(s => s !== correctLine);
      const distractors = pickDistractors(correctLine, distPool, 3);
      const { choices, correct } = shuffleAssign(correctLine, distractors);

      const qText = `${escapeHtml(stemShort)}\n\n<span style="font-size:11px;color:var(--text3)">Packet: ${escapeHtml(base)} · #${prob.num}${sub.label ? `(${sub.label})` : ""}</span>`;

      const sig = `${base}#${prob.num}${sub.label}|${stemShort.slice(0, 120)}`.toLowerCase();
      if (state.seenMcq.has(sig)) continue;
      state.seenMcq.add(sig);

      data.questionBank.push({
        section,
        topic: `[Packet] ${base} · #${prob.num}`,
        calcType: /calculator|calc active/i.test(probText + base) ? "Calculator Active" : "No Calculator",
        question: qText,
        choices,
        correct,
        explanation: keySnips.length
          ? "Correct choice is aligned to the same-number block in the extracted solution PDF when text is available; otherwise verify with the scanned key."
          : "No reliable text was extracted from the answer PDF (often scanned). Use your teacher’s key or the Materials link.",
        notesSection: section,
        notesSnippet: "Generated from your course packets.",
        timeTip: "If unsure, open the worksheet PDF from Materials.",
        packetAuto: true
      });
      state.mcqCount++;
    }
  }

  /* One FRQ per worksheet (condensed) — fills section coverage */
  if (state.frqCount < MAX_FRQ_PER_UNIT) {
    const parts = [];
    let n = 0;
    outer: for (const prob of problems) {
      for (const sub of splitSubparts(prob.body)) {
        if (n >= 12) break outer;
        const stem = sub.text.replace(/\s+/g, " ").trim();
        if (stem.length < 15) continue;
        const ki = Math.min(Number(prob.num) - 1, Math.max(0, keySnips.length - 1));
        const fa =
          keySnips[ki] && keySnips[ki].length >= MIN_KEY_SNIPPET
            ? escapeHtml(keySnips[ki])
            : "Use the answer key PDF in Materials for this worksheet.";
        parts.push({
          label: `(${prob.num}${sub.label ? sub.label : ""})`,
          points: 2,
          question: textToHtml(stem.slice(0, 1200)),
          finalAnswer: fa,
          steps:
            keySnips.length > 0
              ? ["Compare to the extracted key text.", "Show justification as on the packet."]
              : ["Show all steps on paper.", "Confirm with the answer key PDF."],
          scoring: "Reasoning + correct result."
        });
        n++;
      }
    }
    if (parts.length > 0) {
      const title = `${base} (FRQ)`;
      if (!state.seenFrqTitle.has(title) && !state.seenFrqTitle.has(base)) {
        state.seenFrqTitle.add(title);
        state.seenFrqTitle.add(base);
        data.frqBank.push({
          id: state.nextFrqId++,
          packetAuto: true,
          packetSection: section,
          calcAllowed: true,
          title,
          context: `<p><strong>${escapeHtml(base)}</strong> — <a href="${escapeHtml(encodeURI(relPdf))}" target="_blank" rel="noopener noreferrer">Problem PDF</a>${
            keyPath
              ? ` · <a href="${escapeHtml(encodeURI(`${unitFolder}/${relDir}/${path.basename(keyPath)}`.replace(/\\/g, "/")))}" target="_blank" rel="noopener noreferrer">Key</a>`
              : ""
          }</p>`,
          parts
        });
        state.frqCount++;
        state.sectionsWithFrq.add(section);
      }
    }
  }
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureFrqPerSection(data, state) {
  const sections = Array.isArray(data.sections) ? data.sections : [];
  for (const sec of sections) {
    if (state.sectionsWithFrq.has(sec)) continue;
    const mcq = data.questionBank.find(q => q.packetAuto && q.section === sec);
    const stem = mcq
      ? stripHtml(mcq.question).replace(/\s*Packet:.*$/i, "").trim()
      : `Open any homework or review packet for section ${sec} from Materials and complete a representative problem your teacher marked for this topic.`;
    const ans = mcq ? mcq.choices[mcq.correct] : "See answer key PDF linked from Materials for the packet you choose.";
    data.frqBank.push({
      id: state.nextFrqId++,
      packetAuto: true,
      packetSection: sec,
      calcAllowed: true,
      title: `Section ${sec} — packet FRQ (placeholder)`,
      context: `<p>No worksheet was auto-mapped to <strong>${escapeHtml(sec)}</strong> with extractable text. Use this as a prompt to pull one FRQ from your binder, or open Materials and pick a PDF whose title matches this section.</p>`,
      parts: [
        {
          label: "(a)",
          points: 4,
          question: textToHtml(stem.slice(0, 1500)),
          finalAnswer: escapeHtml(String(ans).slice(0, 800)),
          steps: [
            "Select a problem from your packet for this lesson.",
            "Compare your work to the course answer key."
          ],
          scoring: "Graded on method and correctness."
        }
      ]
    });
    state.sectionsWithFrq.add(sec);
    state.frqCount++;
  }
}

async function importUnit(unitNum) {
  const unitFolder = `Unit ${unitNum}`;
  const unitPath = path.join(ROOT, unitFolder);
  const jsonPath = path.join(DATA_DIR, `unit${unitNum}.json`);
  if (!fs.existsSync(unitPath) || !fs.existsSync(jsonPath)) {
    console.log(`Skip unit ${unitNum} (missing folder or JSON)`);
    return;
  }

  const data = readJson(jsonPath);
  if (FLAGS.has("--replace")) {
    data.questionBank = (data.questionBank || []).filter(q => !q.packetAuto);
    data.frqBank = (data.frqBank || []).filter(f => !f.packetAuto);
    console.log(`unit${unitNum}: cleared prior packetAuto items`);
  }

  data.questionBank = data.questionBank || [];
  data.frqBank = data.frqBank || [];

  const nextFrqId =
    data.frqBank.reduce((m, f) => Math.max(m, typeof f.id === "number" ? f.id : -1), -1) + 1;

  const state = {
    mcqCount: 0,
    frqCount: 0,
    seenMcq: new Set(
      data.questionBank.map(q =>
        String(q.question || "")
          .toLowerCase()
          .slice(0, 200)
      )
    ),
    seenFrqTitle: new Set(data.frqBank.map(f => f.title)),
    sectionsWithFrq: new Set(),
    nextFrqId
  };

  for (const f of data.frqBank) {
    if (f.packetSection) {
      state.sectionsWithFrq.add(f.packetSection);
    } else {
      const g = inferSectionFromFrqTitle(f.title, unitNum, data.sections || []);
      if (g) state.sectionsWithFrq.add(g);
    }
  }

  const pdfDirs = listPdfDirs(unitPath);
  for (const rel of pdfDirs) {
    const dir = path.join(unitPath, rel);
    let files;
    try {
      files = fs.readdirSync(dir).filter(isProblemPdf);
    } catch {
      continue;
    }
    for (const file of files) {
      await processPdf(unitNum, unitFolder, rel, file, data, state);
    }
  }

  ensureFrqPerSection(data, state);

  writeJson(jsonPath, data);
  console.log(
    `unit${unitNum}: +${state.mcqCount} MCQs (packetAuto), +${state.frqCount} FRQ worksheets/placeholders, total MCQ ${data.questionBank.length}, FRQ ${data.frqBank.length}`
  );
}

const units =
  args.length > 0
    ? args.map(Number).filter(n => n >= 1 && n <= 10)
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

(async () => {
  for (const n of units) {
    await importUnit(n);
  }
  console.log("\nDone. Run: node tools/validate-unit-data.mjs");
})().catch(e => {
  console.error(e);
  process.exit(1);
});
