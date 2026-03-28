import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SEEDS = path.join(ROOT, "tools", "hw-mcq-seeds.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function normQ(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const seeds = readJson(SEEDS);
const byUnit = new Map();
for (const s of seeds) {
  const u = s.unit;
  if (!byUnit.has(u)) byUnit.set(u, []);
  byUnit.get(u).push(s);
}

let totalAdded = 0;
for (const [unitNum, list] of byUnit) {
  const jp = path.join(ROOT, "data", `unit${unitNum}.json`);
  if (!fs.existsSync(jp)) {
    console.warn(`skip missing ${jp}`);
    continue;
  }
  const data = readJson(jp);
  const bank = data.questionBank || (data.questionBank = []);
  const seen = new Set(bank.map(q => normQ(q.question)));

  for (const s of list) {
    const sig = normQ(s.question);
    if (seen.has(sig)) continue;

    const { unit, ...mcq } = s;
    bank.push(mcq);
    seen.add(sig);
    totalAdded++;
    console.log(`unit${unitNum}: + ${(mcq.topic || "").slice(0, 50)}`);
  }

  writeJson(jp, data);
}

console.log(`\nDone. Appended ${totalAdded} homework-derived MCQ(s).`);
