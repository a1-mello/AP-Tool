import fs from "fs";
import vm from "vm";
import path from "path";

const ROOT = process.cwd();
const HTML_PATH = path.join(ROOT, "ap_calc_study_11.html");
const OUT_UNIT6 = path.join(ROOT, "data", "unit6.json");
const OUT_UNIT8 = path.join(ROOT, "data", "unit8.json");

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

function extractBetween(src, startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  if (start === -1) throw new Error(`Could not find start needle: ${startNeedle}`);
  const from = start + startNeedle.length;
  const end = src.indexOf(endNeedle, from);
  if (end === -1) throw new Error(`Could not find end needle: ${endNeedle}`);
  return src.slice(from, end);
}

function evalJsExpression(expr) {
  const context = {};
  // Wrap in parentheses so object literals parse.
  const script = new vm.Script(`(${expr})`);
  return script.runInNewContext(context, { timeout: 2000 });
}

function evalConstInitializer(html, constName) {
  // This is intentionally simple: it finds `const X =` and then slices until the next `;\n`
  const needle = `const ${constName} =`;
  const idx = html.indexOf(needle);
  if (idx === -1) throw new Error(`Could not find const ${constName}`);
  const after = html.slice(idx + needle.length);
  const semi = after.indexOf(";\n");
  if (semi === -1) throw new Error(`Could not find end of const ${constName} initializer`);
  const initializer = after.slice(0, semi).trim();
  return evalJsExpression(initializer);
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function sectionStartsWith(section, prefix) {
  return typeof section === "string" && section.startsWith(prefix);
}

function main() {
  const html = readFile(HTML_PATH);

  const questionBank = evalConstInitializer(html, "questionBank");
  const notesData = evalConstInitializer(html, "notesData");
  const frqBank = evalConstInitializer(html, "frqBank");

  if (!Array.isArray(questionBank)) throw new Error("questionBank did not evaluate to an array");
  if (typeof notesData !== "object" || notesData === null) throw new Error("notesData did not evaluate to an object");
  if (!Array.isArray(frqBank)) throw new Error("frqBank did not evaluate to an array");

  const q6 = questionBank.filter((q) => sectionStartsWith(q.section, "6."));
  const q8 = questionBank.filter((q) => sectionStartsWith(q.section, "8."));

  const n6 = Object.fromEntries(Object.entries(notesData).filter(([k]) => k.startsWith("6.")));
  const n8 = Object.fromEntries(Object.entries(notesData).filter(([k]) => k.startsWith("8.")));

  const sections6 = [...new Set(q6.map((q) => q.section).filter(Boolean))].sort();
  const sections8 = [...new Set(q8.map((q) => q.section).filter(Boolean))].sort();

  const unit6 = {
    unit: "Unit 6",
    sections: sections6,
    questionBank: q6,
    frqBank: frqBank,
    notesData: n6
  };

  const unit8 = {
    unit: "Unit 8",
    sections: sections8,
    questionBank: q8,
    frqBank: [],
    notesData: n8
  };

  writeJson(OUT_UNIT6, unit6);
  writeJson(OUT_UNIT8, unit8);

  console.log(`Wrote ${q6.length} Unit 6 MCQs to data/unit6.json`);
  console.log(`Wrote ${q8.length} Unit 8 MCQs to data/unit8.json`);
  console.log(`Wrote ${Object.keys(n6).length} Unit 6 notes sections to data/unit6.json`);
  console.log(`Wrote ${Object.keys(n8).length} Unit 8 notes sections to data/unit8.json`);
  console.log(`Wrote ${frqBank.length} FRQs to data/unit6.json (Unit 8 FRQs left empty for now)`);
}

main();

