#!/usr/bin/env node
/**
 * Dump extractable text from a PDF (helps draft worksheet prompts).
 * Usage: node tools/pdf-extract-text.cjs "path/to/worksheet.pdf"
 * Requires: pdf-parse (already in devDependencies). Scanned pages may be empty — OCR is not included.
 */
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/pdf-extract-text.cjs "path/to/file.pdf"');
  process.exit(1);
}
const abs = path.resolve(process.cwd(), file);
if (!fs.existsSync(abs)) {
  console.error("File not found:", abs);
  process.exit(1);
}
const buf = fs.readFileSync(abs);
pdf(buf)
  .then(data => {
    process.stdout.write(data.text || "");
    process.stdout.write("\n");
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
