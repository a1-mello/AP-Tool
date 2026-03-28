/**
 * Audit MCQs: verify computable items with mathjs; flag packet fallbacks and unparseable stems.
 *
 *   node tools/audit-mcq-math.mjs
 *   node tools/audit-mcq-math.mjs --fix   # update JSON when a different letter uniquely matches math
 *
 * Does NOT read handwritten PDF keys — only symbolic/numeric checks where parsing succeeds.
 */

import fs from "fs";
import path from "path";
import { derivative, parse, simplify } from "mathjs";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const REPORT_DIR = path.join(ROOT, "reports");
const FIX = process.argv.includes("--fix");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeExpr(s) {
  let t = stripHtml(s);
  t = t
    .replace(/−/g, "-")
    .replace(/–/g, "-")
    .replace(/′/g, "'")
    .replace(/'/g, "'")
    .replace(/·/g, "*")
    .replace(/\u00b2/g, "^2")
    .replace(/\u00b3/g, "^3")
    .replace(/π/g, "pi")
    .replace(/\bln\b/gi, "log")
    .replace(/\barcsin\b/gi, "asin")
    .replace(/\barccos\b/gi, "acos")
    .replace(/\barctan\b/gi, "atan")
    .replace(/\bsin²\s*\(/g, "sin(") // rough
    .replace(/\bcos²\s*\(/g, "cos(");
  t = t.replace(/\bsin\s+x\b/gi, "sin(x)");
  t = t.replace(/\bcos\s+x\b/gi, "cos(x)");
  t = t.replace(/\btan\s+x\b/gi, "tan(x)");
  t = t.replace(/\^/g, "^");
  return t.trim();
}

function tryParse(expr) {
  try {
    return parse(expr);
  } catch {
    return null;
  }
}

/** Sample numeric equality of two expressions in variable `v` on points avoiding poles where possible */
function exprEqualTwoVars(aStr, bStr, samples = [
  [1, 0.5],
  [2, -0.3],
  [-0.5, 1.2]
]) {
  const A = tryParse(normalizeExpr(aStr));
  const B = tryParse(normalizeExpr(bStr));
  if (!A || !B) return false;
  for (const [xv, yv] of samples) {
    try {
      const av = A.evaluate({ x: xv, y: yv });
      const bv = B.evaluate({ x: xv, y: yv });
      if (typeof av !== "number" || typeof bv !== "number" || !Number.isFinite(av) || !Number.isFinite(bv))
        return false;
      if (Math.abs(av - bv) > 1e-5) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function exprEqualOnSamples(aStr, bStr, v = "x", samples = [0.3, 1.1, -0.7, 2.2, -1.2]) {
  const na = normalizeExpr(aStr);
  const nb = normalizeExpr(bStr);
  const A = tryParse(na);
  const B = tryParse(nb);
  if (!A || !B) return false;
  for (const xv of samples) {
    try {
      const av = A.evaluate({ [v]: xv });
      const bv = B.evaluate({ [v]: xv });
      if (typeof av !== "number" || typeof bv !== "number" || !Number.isFinite(av) || !Number.isFinite(bv))
        continue;
      if (Math.abs(av - bv) > 1e-5) return false;
    } catch {
      /* try next sample */
    }
  }
  return true;
}

function scalarEqual(aStr, bStr) {
  const na = normalizeExpr(aStr);
  const nb = normalizeExpr(bStr);
  const A = tryParse(na);
  const B = tryParse(nb);
  if (!A || !B) return false;
  try {
    const d = simplify(parse(`(${na})-(${nb})`));
    const z = d.evaluate();
    if (typeof z === "number" && Math.abs(z) < 1e-9) return true;
  } catch {
    /* fall through */
  }
  try {
    const av = A.evaluate();
    const bv = B.evaluate();
    if (typeof av === "number" && typeof bv === "number") return Math.abs(av - bv) < 1e-9;
  } catch {
    return false;
  }
  return false;
}

function derivativeAt(exprStr, v, x0) {
  const e = normalizeExpr(exprStr);
  const node = tryParse(e);
  if (!node) return null;
  try {
    const d = derivative(node, v);
    const val = d.evaluate({ [v]: x0 });
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

function derivativeExprString(exprStr, v = "x") {
  const e = normalizeExpr(exprStr);
  const node = tryParse(e);
  if (!node) return null;
  try {
    const d = derivative(node, v);
    return d.toString();
  } catch {
    return null;
  }
}

const GENERIC_FALLBACK =
  /work this item on paper|official answer key|answer key pdf|check with your teacher|verify with the scanned key/i;

function choicesMap(q) {
  return q.choices || {};
}

function auditQuestion(q, ctx) {
  const letters = ["A", "B", "C", "D"];
  const ch = choicesMap(q);
  const correct = q.correct;
  const correctText = ch[correct] || "";

  if (GENERIC_FALLBACK.test(correctText)) {
    return { status: "UNVERIFIED_NO_EXTRACTABLE_KEY", detail: "Correct choice is generic PDF fallback" };
  }

  const stem = normalizeExpr(q.question).replace(/\s*Packet:.*$/i, "");

  // --- Pattern: If f(x)= ... then f'(-1) =  (numeric answer)
  {
    const m = stem.match(
      /If\s+f\(x\)\s*=\s*(.+?),\s*then\s+f['']?\(([-\d.]+)\)\s*=/i
    );
    if (m) {
      const expr = m[1].trim();
      const x0 = Number(m[2]);
      const val = derivativeAt(expr, "x", x0);
      if (val !== null) {
        let matchLetter = null;
        let matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          const n = tryParse(normalizeExpr(t));
          if (n) {
            try {
              const ev = n.evaluate();
              if (typeof ev === "number" && Math.abs(ev - val) < 1e-5) matches.push(L);
            } catch {
              if (scalarEqual(t, String(val))) matches.push(L);
            }
          } else if (scalarEqual(t, String(val)) || scalarEqual(t, val.toFixed(0)) || scalarEqual(t, val.toString()))
            matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `f'(${x0})=${val}, computed match ${matches[0]}, marked ${correct}`
          };
        }
        if (matches.length === 0) {
          return { status: "UNVERIFIED_UNPARSEABLE_CHOICES", detail: `Computed f'(${x0})=${val}, no matching choice` };
        }
        return { status: "AMBIGUOUS", detail: `Multiple letters match numeric ${val}` };
      }
    }
  }

  // --- Pattern: If g(x)=(num)/(den), then g'(x) equals
  {
    const m = stem.match(/If\s+g\(x\)\s*=\s*\(([^)]+)\)\s*\/\s*\(([^)]+)\)\s*,\s*then\s+g['']?\(x\)\s*equals/i);
    if (m) {
      const num = m[1].trim();
      const den = m[2].trim();
      const expr = `(${num})/(${den})`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `g' symbolic match ${matches[0]}, marked ${correct}`
          };
        }
        if (matches.length === 0)
          return { status: "UNVERIFIED_UNPARSEABLE_CHOICES", detail: "g' computed but no choice matched numerically" };
        return { status: "AMBIGUOUS", detail: "Multiple choices match g'" };
      }
    }
  }

  // --- Pattern: If f(x)=(3x^2-5x+1)^6, then f'(x) =
  {
    const m = stem.match(/If\s+f\(x\)\s*=\s*\(([^)]+)\)\^(\d+)\s*,\s*then\s+f['']?\(x\)\s*=/i);
    if (m) {
      const inner = m[1].trim();
      const p = Number(m[2]);
      const expr = `(${inner})^${p}`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `chain/power match ${matches[0]}`
          };
        }
      }
    }
  }

  // --- Pattern: If g(x)=sin^2(3x-1) or sin(3x-1)^2
  {
    const m = stem.match(/If\s+g\(x\)\s*=\s*sin\^2\s*\(([^)]+)\)/i);
    if (m) {
      const inner = normalizeExpr(m[1].trim());
      const expr = `sin(${inner})^2`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x", [0.2, 0.5, 1.0])) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `sin^2(u) chain match ${matches[0]}`
          };
        }
      }
    }
    const mSinParenSq = stem.match(/If\s+g\(x\)\s*=\s*sin\(([^)]+)\)\^2/i);
    if (mSinParenSq) {
      const inner = normalizeExpr(mSinParenSq[1].trim());
      const expr = `sin(${inner})^2`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x", [0.2, 0.5, 1.0])) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `sin(u)^2 chain match ${matches[0]}`
          };
        }
      }
    }
  }

  // --- Pattern: F(x)=(x^2+1)^3, F'(1)
  {
    const m = stem.match(/If\s+F\(x\)\s*=\s*\(([^)]+)\)\^(\d+)\s*,\s*then\s+F['']?\(([-\d.]+)\)\s*=/i);
    if (m) {
      const inner = m[1].trim();
      const p = Number(m[2]);
      const x0 = Number(m[3]);
      const expr = `(${inner})^${p}`;
      const val = derivativeAt(expr, "x", x0);
      if (val !== null) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          const n = tryParse(normalizeExpr(t));
          if (n) {
            try {
              const ev = n.evaluate();
              if (typeof ev === "number" && Math.abs(ev - val) < 1e-4) matches.push(L);
            } catch {
              /* */
            }
          }
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `F'(${x0})=${val}`
          };
        }
      }
    }
  }

  // --- Pattern: For f(x)=(x-1)/(x+2), the derivative f'(x) equals
  {
    const m = stem.match(/For\s+f\(x\)\s*=\s*\(([^)]+)\)\s*\/\s*\(([^)]+)\)\s*,\s*the\s+derivative\s+f['']?\(x\)\s*equals/i);
    if (m) {
      const expr = `(${m[1].trim()})/(${m[2].trim()})`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `rational f' match ${matches[0]}`
          };
        }
      }
    }
  }

  // --- Pattern: h'(3) for h(x)=2x^3-x^2+1/x-3
  {
    const m = stem.match(
      /If\s+h\(x\)\s*=\s*(.+?),\s*then\s+h['']?\(([-\d.]+)\)\s*=/i
    );
    if (m && /x\^3|\/x/i.test(m[1])) {
      const expr = m[1].trim();
      const x0 = Number(m[2]);
      const val = derivativeAt(expr, "x", x0);
      if (val !== null) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (t.includes("/") && t.includes("9")) {
            const n = tryParse(normalizeExpr(t));
            if (n) {
              try {
                const ev = n.evaluate();
                if (typeof ev === "number" && Math.abs(ev - val) < 1e-4) matches.push(L);
              } catch {
                /* */
              }
            }
          }
        }
        if (matches.length === 0) {
          for (const L of letters) {
            const t = ch[L];
            if (!t) continue;
            const n = tryParse(normalizeExpr(t));
            if (n) {
              try {
                const ev = n.evaluate();
                if (typeof ev === "number" && Math.abs(ev - val) < 1e-4) matches.push(L);
              } catch {
                /* */
              }
            }
          }
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `h'(${x0})=${val}`
          };
        }
      }
    }
  }

  // --- Pattern: d/dx[(u)(v)] product (e.g. (x^2)(sin x))
  {
    const m = stem.match(/d\/dx\[\(([^)]+)\)\s*\(([^)]+)\)\]\s*=?/i);
    if (m) {
      const u = normalizeExpr(m[1].trim());
      const v = normalizeExpr(m[2].trim());
      const expr = `(${u})*(${v})`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: "product rule bracket"
          };
        }
      }
    }
  }

  // --- Pattern: d/dx(x^2) equals / = / :
  {
    const m = stem.match(/d\/dx\(([^)]+)\)\s*(equals|=|:)/i);
    if (m) {
      const inner = m[1].trim();
      const dstr = derivativeExprString(inner, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: "d/dx short equals"
          };
        }
      }
    }
  }

  // --- Pattern: d/dx[(x^2+1)/x] quotient explicit
  {
    const m = stem.match(/d\/dx\[\(([^)]+)\)\/x\]/i);
    if (m) {
      const inner = m[1].trim();
      const expr = `(${inner})/x`;
      const dstr = derivativeExprString(expr, "x");
      if (dstr) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          if (exprEqualOnSamples(dstr, normalizeExpr(t), "x")) matches.push(L);
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: "quotient x denom"
          };
        }
      }
    }
  }

  // --- Pattern: lim_{x→∞} rational (two linear)
  {
    const m = stem.match(
      /lim_\{x→∞\}\s*\(([^)]+)\)\s*\/\s*\(([^)]+)\)\s*equals/i
    );
    if (m) {
      const expr = `(${normalizeExpr(m[1])})/(${normalizeExpr(m[2])})`;
      let val;
      try {
        val = parse(expr).compile().evaluate({ x: 1e9 });
      } catch {
        val = null;
      }
      if (typeof val === "number" && Number.isFinite(val)) {
        const matches = [];
        for (const L of letters) {
          const t = ch[L];
          if (!t) continue;
          const n = tryParse(normalizeExpr(t));
          if (n) {
            try {
              const ev = n.evaluate();
              if (typeof ev === "number" && Math.abs(ev - val) < 1e-4) matches.push(L);
            } catch {
              /* */
            }
          }
        }
        if (matches.length === 1) {
          const ok = matches[0] === correct;
          return {
            status: ok ? "VERIFIED" : "MISMATCH",
            computedLetter: matches[0],
            detail: `lim x→∞ ≈ ${val}`
          };
        }
      }
    }
  }

  // --- Pattern: If 3x^2−2y+4xy=6, then dy/dx = (implicit)
  {
    const m = stem.match(
      /If\s+3x\^2\s*-\s*2y\s*\+\s*4xy\s*=\s*6\s*,\s*then\s+dy\/dx\s*=/i
    );
    if (m) {
      const truth = "(6*x+4*y)/(2-4*x)";
      const matches = [];
      for (const L of letters) {
        const t = ch[L];
        if (!t) continue;
        if (exprEqualTwoVars(truth, normalizeExpr(t))) matches.push(L);
      }
      if (matches.length === 1) {
        const ok = matches[0] === correct;
        return {
          status: ok ? "VERIFIED" : "MISMATCH",
          computedLetter: matches[0],
          detail: "implicit 3x^2-2y+4xy=6"
        };
      }
    }
  }

  return { status: "NOT_CHECKED", detail: "No matching verifier (concept, messy PDF text, or proof-style)" };
}

function main() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter(f => /^unit\d+\.json$/i.test(f))
    .map(f => path.join(DATA_DIR, f))
    .sort();

  const summary = {
    VERIFIED: 0,
    MISMATCH: 0,
    UNVERIFIED_NO_EXTRACTABLE_KEY: 0,
    UNVERIFIED_UNPARSEABLE_CHOICES: 0,
    AMBIGUOUS: 0,
    NOT_CHECKED: 0,
    total: 0
  };

  const mismatches = [];
  let totalFixes = 0;

  for (const fp of files) {
    const data = readJson(fp);
    const bank = data.questionBank || [];
    const unitName = path.basename(fp);
    let fileChanged = false;
    bank.forEach((q, idx) => {
      summary.total++;
      const r = auditQuestion(q, { unit: unitName, idx });
      summary[r.status] = (summary[r.status] || 0) + 1;

      if (r.status === "MISMATCH") {
        mismatches.push({
          file: unitName,
          idx,
          topic: q.topic,
          detail: r.detail,
          computedLetter: r.computedLetter,
          question: stripHtml(q.question).slice(0, 120)
        });
        if (FIX && r.computedLetter && r.computedLetter !== q.correct) {
          q.correct = r.computedLetter;
          q.explanation = (q.explanation || "") + " [Auto-corrected: mathjs audit tools/audit-mcq-math.mjs]";
          fileChanged = true;
          totalFixes++;
        }
      }
    });

    if (FIX && fileChanged) writeJson(fp, data);
  }

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, "mcq-math-audit.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ summary, mismatches: mismatches.slice(0, 500), note: mismatches.length > 500 ? "truncated" : null }, null, 2) + "\n"
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(`Mismatches listed: ${mismatches.length}`);
  if (FIX && totalFixes) console.log(`Applied ${totalFixes} auto-fixes (MISMATCH with unique computed letter only).`);
}

main();
