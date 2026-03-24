import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function listUnitFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^unit\d+\.json$/i.test(f))
    .map((f) => path.join(DATA_DIR, f))
    .sort();
}

function validateMCQ(q, idx, issues, seenQuestions) {
  const where = `questionBank[${idx}]`;
  const required = ["section", "topic", "calcType", "question", "choices", "correct", "explanation"];
  for (const key of required) {
    if (!(key in q)) issues.push(`${where}: missing "${key}"`);
  }

  if (!isObject(q.choices)) {
    issues.push(`${where}: "choices" must be an object with A/B/C/D`);
    return;
  }

  const letters = ["A", "B", "C", "D"];
  for (const l of letters) {
    if (typeof q.choices[l] !== "string" || q.choices[l].trim() === "") {
      issues.push(`${where}: choices.${l} missing or empty`);
    }
  }

  if (!letters.includes(q.correct)) {
    issues.push(`${where}: "correct" must be one of A/B/C/D`);
  } else if (!q.choices[q.correct]) {
    issues.push(`${where}: correct="${q.correct}" but that choice is missing`);
  }

  if (typeof q.question === "string") {
    const key = q.question.trim().toLowerCase();
    if (seenQuestions.has(key)) {
      issues.push(`${where}: duplicate question text detected`);
    } else {
      seenQuestions.add(key);
    }
  }
}

function validateFRQ(frq, idx, issues) {
  const where = `frqBank[${idx}]`;
  const required = ["id", "calcAllowed", "title", "context", "parts"];
  for (const key of required) {
    if (!(key in frq)) issues.push(`${where}: missing "${key}"`);
  }
  if (!Array.isArray(frq.parts) || frq.parts.length === 0) {
    issues.push(`${where}: "parts" must be a non-empty array`);
    return;
  }
  frq.parts.forEach((part, pIdx) => {
    const pWhere = `${where}.parts[${pIdx}]`;
    const pRequired = ["label", "points", "question", "finalAnswer", "steps", "scoring"];
    for (const key of pRequired) {
      if (!(key in part)) issues.push(`${pWhere}: missing "${key}"`);
    }
    if (!Array.isArray(part.steps) || part.steps.length === 0) {
      issues.push(`${pWhere}: "steps" must be a non-empty array`);
    }
  });
}

function validateNotes(notesData, issues) {
  if (!isObject(notesData)) {
    issues.push(`notesData: must be an object keyed by section (ex "7.1")`);
    return;
  }
  for (const [section, value] of Object.entries(notesData)) {
    if (!isObject(value)) {
      issues.push(`notesData.${section}: must be an object`);
      continue;
    }
    if (typeof value.title !== "string" || value.title.trim() === "") {
      issues.push(`notesData.${section}: missing/empty "title"`);
    }
    if (typeof value.content !== "string" || value.content.trim() === "") {
      issues.push(`notesData.${section}: missing/empty "content"`);
    }
  }
}

function validateUnitFile(filePath) {
  const name = path.basename(filePath);
  const issues = [];
  let data;

  try {
    data = readJson(filePath);
  } catch (err) {
    return { name, issues: [`Invalid JSON: ${err.message}`] };
  }

  if (!isObject(data)) {
    return { name, issues: ["Top-level JSON must be an object"] };
  }

  const topRequired = ["unit", "sections", "questionBank", "frqBank", "notesData"];
  for (const key of topRequired) {
    if (!(key in data)) issues.push(`missing top-level "${key}"`);
  }

  if (!Array.isArray(data.sections)) issues.push(`"sections" must be an array`);
  if (!Array.isArray(data.questionBank)) issues.push(`"questionBank" must be an array`);
  if (!Array.isArray(data.frqBank)) issues.push(`"frqBank" must be an array`);

  const seenQuestions = new Set();
  if (Array.isArray(data.questionBank)) {
    data.questionBank.forEach((q, idx) => validateMCQ(q, idx, issues, seenQuestions));
  }
  if (Array.isArray(data.frqBank)) {
    data.frqBank.forEach((f, idx) => validateFRQ(f, idx, issues));
  }
  validateNotes(data.notesData, issues);

  return { name, issues };
}

function main() {
  const files = listUnitFiles();
  if (files.length === 0) {
    console.log("No unit JSON files found in data/ (expected data/unitX.json)");
    process.exit(0);
  }

  let totalIssues = 0;
  for (const file of files) {
    const result = validateUnitFile(file);
    if (result.issues.length === 0) {
      console.log(`PASS ${result.name}`);
    } else {
      console.log(`FAIL ${result.name}`);
      for (const issue of result.issues) console.log(`  - ${issue}`);
      totalIssues += result.issues.length;
    }
  }

  console.log(`\nValidation complete. Issues found: ${totalIssues}`);
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
