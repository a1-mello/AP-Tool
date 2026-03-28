import fs from "fs";
import path from "path";

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

function packetPdfSection(materials) {
  const notes = (materials || []).filter(m => m.type === "notes");
  const hw = (materials || []).filter(m => m.type === "homework");
  if (notes.length === 0 && hw.length === 0) return null;

  const links = (arr, label) => {
    if (!arr.length) return "";
    const rows = arr
      .map(
        m =>
          `<a href="${escapeHtml(encodeURI(m.path))}" target="_blank" rel="noopener noreferrer" style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#fff;text-decoration:none;color:var(--text);margin-bottom:6px"><span style="font-weight:600;font-size:13px">${escapeHtml(m.title)}</span><span style="font-size:12px;color:var(--text3)">Open ↗</span></a>`
      )
      .join("");
    return `<h3 style="margin-top:14px">${label}</h3><div style="display:flex;flex-direction:column">${rows}</div>`;
  };

  return {
    title: "Packet PDFs (class notes & homework)",
    content: `<div class="notes-block"><p style="color:var(--text2);margin-bottom:10px">These match your physical binders. Use them alongside the MCQ/FRQ banks.</p>${links(notes, "Notes packets")}${links(hw, "Homework packets")}</div>`
  };
}

function referenceFromMaterials(unitLabel, materials) {
  const notes = (materials || []).filter(m => m.type === "notes").length;
  const hw = (materials || []).filter(m => m.type === "homework").length;
  const rev = (materials || []).filter(m => m.type === "review").length;
  return `<div class="ap-note" style="margin-bottom:12px"><strong>${escapeHtml(unitLabel)}</strong> — Materials on this site include <strong>${notes}</strong> notes PDFs, <strong>${hw}</strong> homework PDFs, and <strong>${rev}</strong> review PDFs. Open <strong>Materials (PDFs)</strong> in the sidebar for the full list.</div><p style="font-size:13px;color:var(--text2)">The formula blocks below are the shared AP Calc AB reference; your unit packets explain how they show up in your course.</p>`;
}

const EXTRA_FLASH = {
  1: [
    { front: "Definition: f is continuous at x = a", back: "f(a) exists, lim(x→a) f(x) exists, and they are equal.", tag: "theorems" },
    { front: "When does lim(x→a) f(x) exist?", back: "When the left-hand and right-hand limits exist and agree.", tag: "theorems" },
    { front: "Vertical asymptote vs hole", back: "Hole: removable discontinuity after simplifying. VA: unbounded behavior (often denominator → 0).", tag: "theorems" }
  ],
  2: [
    { front: "Limit definition of f′(a)", back: "lim(h→0) [f(a+h)−f(a)]/h, provided the limit exists.", tag: "derivatives" },
    { front: "Differentiable ⇒ ?", back: "Continuous at that point (not the converse).", tag: "theorems" },
    { front: "Power rule: d/dx(x^n)", back: "n x^(n−1) (for real n where defined).", tag: "derivatives" }
  ],
  3: [
    { front: "Chain rule (Leibniz)", back: "dy/dx = dy/du · du/dx", tag: "derivatives" },
    { front: "d/dx e^x and d/dx ln x", back: "e^x and 1/x (x>0 for ln).", tag: "derivatives" },
    { front: "Product rule", back: "(fg)′ = f′g + fg′", tag: "derivatives" }
  ],
  4: [
    { front: "First derivative test idea", back: "Sign changes of f′ locate local extrema (with continuity).", tag: "theorems" },
    { front: "Second derivative test (local max)", back: "If f′(c)=0 and f″(c)<0, local max at c.", tag: "theorems" },
    { front: "Inflection point", back: "Where concavity changes; often f″ changes sign (candidates where f″=0 or undefined).", tag: "theorems" }
  ],
  5: [
    { front: "Antiderivative of cos x", back: "sin x + C", tag: "integrals" },
    { front: "∫ sec² x dx", back: "tan x + C", tag: "integrals" },
    { front: "Average value of f on [a,b]", back: "1/(b−a) ∫_a^b f(x) dx", tag: "integrals" }
  ],
  7: [
    { front: "Differential equation: what is a solution?", back: "A function (or family) that satisfies the DE on an interval.", tag: "theorems" },
    { front: "Separation of variables (concept)", back: "Algebraically isolate each variable on opposite sides, then integrate.", tag: "theorems" }
  ],
  9: [
    { front: "Geometric series sum (|r|<1)", back: "a/(1−r) for a + ar + ar² + …", tag: "theorems" },
    { front: "nth-term test for divergence", back: "If lim a_n ≠ 0, then Σ a_n diverges.", tag: "theorems" }
  ],
  10: [
    { front: "Taylor polynomial idea", back: "Match derivatives at a center up to order n.", tag: "theorems" },
    { front: "Lagrange error bound (concept)", back: "Uses max |f^(n+1)| on the interval to bound remainder.", tag: "theorems" }
  ]
};

function mergeFlashcards(unitNum, sections) {
  const extra = EXTRA_FLASH[unitNum] || [];
  const fromSections = (sections || []).slice(0, 6).map(sec => ({
    front: `Study focus — section ${sec}`,
    back: `Filter MCQs to ${sec} and re-read the matching notes tab or packet PDF.`,
    tag: "theorems"
  }));
  return [...extra, ...fromSections];
}

function main() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter(f => /^unit\d+\.json$/i.test(f))
    .map(f => path.join(DATA_DIR, f))
    .sort();

  for (const fp of files) {
    const data = readJson(fp);
    const m = path.basename(fp).match(/unit(\d+)/i);
    const n = m ? Number(m[1]) : 0;
    const unitLabel = data.unit || `Unit ${n}`;

    data.notesData = data.notesData && typeof data.notesData === "object" ? data.notesData : {};
    if (!data.notesData["packet-pdfs"]) {
      const pkt = packetPdfSection(data.materials);
      if (pkt) data.notesData["packet-pdfs"] = pkt;
    }

    if (!data.referenceHtml) {
      data.referenceHtml = referenceFromMaterials(unitLabel, data.materials);
    }
    if (!data.referenceBlurb) {
      data.referenceBlurb = "Shared AB formulas plus a short pointer to this unit’s PDF materials.";
    }

    if ((!Array.isArray(data.flashcards) || data.flashcards.length === 0) && n !== 6 && n !== 8) {
      data.flashcards = mergeFlashcards(n, data.sections);
    }

    writeJson(fp, data);
    console.log(`Enriched ${path.basename(fp)}`);
  }
}

main();
