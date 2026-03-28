#!/usr/bin/env node
/**
 * Remove MCQs that are packet placeholders (packetAuto or "work on paper" choice).
 * Run: node tools/strip-packet-mcqs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const NEEDLE = "Work this item on paper";

function isPacketMcq(q) {
  if (q.packetAuto) return true;
  const ch = q.choices || {};
  return ["A", "B", "C", "D"].some(L => typeof ch[L] === "string" && ch[L].includes(NEEDLE));
}

let removedTotal = 0;
for (let n = 1; n <= 10; n++) {
  const fp = path.join(dataDir, `unit${n}.json`);
  if (!fs.existsSync(fp)) continue;
  const raw = fs.readFileSync(fp, "utf8");
  const j = JSON.parse(raw);
  const qb = j.questionBank;
  if (!Array.isArray(qb)) continue;
  const kept = qb.filter(q => !isPacketMcq(q));
  removedTotal += qb.length - kept.length;
  j.questionBank = kept;
  fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log(`unit${n}.json: ${qb.length} → ${kept.length} MCQs`);
}
console.log(`Done. Removed ${removedTotal} packet placeholder MCQs.`);
