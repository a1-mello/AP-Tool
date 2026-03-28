import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

function listDirs(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  } catch {
    return [];
  }
}

function listFiles(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isFile()).map(d => d.name);
  } catch {
    return [];
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function unitNumberFromFolder(folderName) {
  const m = folderName.match(/^Unit\s+(\d+)$/i);
  return m ? Number(m[1]) : null;
}

function niceTitle(fileName) {
  return fileName.replace(/\.pdf$/i, "");
}

function gatherUnitMaterials(unitFolderName) {
  const unitPath = path.join(ROOT, unitFolderName);
  const subdirs = listDirs(unitPath);
  const typeByNorm = { homework: "homework", notes: "notes", review: "review" };
  const out = [];

  for (const d of subdirs) {
    const norm = d.trim().toLowerCase();
    const type = typeByNorm[norm];
    if (!type) continue;
    const secPath = path.join(unitPath, d);
    const pdfs = listFiles(secPath).filter(f => /\.pdf$/i.test(f));
    for (const f of pdfs) {
      out.push({
        type,
        title: niceTitle(f),
        path: `${unitFolderName}/${d}/${f}`
      });
    }
  }

  return out;
}

function main() {
  const unitFolders = listDirs(ROOT).filter(d => /^Unit\s+\d+$/i.test(d));
  if (unitFolders.length === 0) {
    console.log("No Unit folders found (expected 'Unit 1', 'Unit 2', ...).");
    process.exit(0);
  }

  let updated = 0;
  for (const uf of unitFolders) {
    const n = unitNumberFromFolder(uf);
    if (!n) continue;

    const unitJsonPath = path.join(DATA_DIR, `unit${n}.json`);
    if (!fs.existsSync(unitJsonPath)) continue;

    const materials = gatherUnitMaterials(uf);
    const unitJson = readJson(unitJsonPath);
    unitJson.materials = materials;
    writeJson(unitJsonPath, unitJson);
    console.log(`Updated unit${n}.json materials: ${materials.length} PDFs`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} unit JSON file(s).`);
}

main();

