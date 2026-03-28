#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const fp = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "unit1.json");
const j = JSON.parse(fs.readFileSync(fp, "utf8"));

j.notesData["1.1"] = {
  title: "1-1 to 1-4: Limits from Graphs and Tables",
  content: `<div class="notes-block">
  <div class="subunit-tag">LIM-1 · Estimating limits</div>
  <h3>What a limit means</h3>
  <p>The limit of <em>f</em>(<em>x</em>) as <em>x</em> approaches <em>a</em> is the value the outputs <strong>approach</strong> — not necessarily <em>f</em>(<em>a</em>). You can read it from a graph, a table, or algebra later.</p>
  <div class="definition-box"><div class="def-label">Two-sided limit</div>
  <p><strong>lim<sub><em>x</em>→<em>a</em></sub> <em>f</em>(<em>x</em>) = <em>L</em></strong> means: as <em>x</em> gets arbitrarily close to <em>a</em> from <strong>both sides</strong>, <em>f</em>(<em>x</em>) gets arbitrarily close to <em>L</em>.</p></div>
  <div class="formula-box">lim<sub><em>x</em>→<em>a</em></sub> <em>f</em>(<em>x</em>) exists ⟺ left-hand limit = right-hand limit = same number <em>L</em></div>
</div>
<div class="notes-block">
  <h3>How to read limits from a graph</h3>
  <ol style="line-height:1.65;color:var(--text2)">
    <li>Trace the curve toward <em>x</em> = <em>a</em> from the <strong>left</strong>. The <em>y</em>-height you approach is the left-hand limit.</li>
    <li>Trace from the <strong>right</strong>. That height is the right-hand limit.</li>
    <li>If both match, that common value is the two-sided limit. If they differ, the two-sided limit <strong>does not exist</strong>.</li>
    <li>An <strong>open circle</strong> at (<em>a</em>, <em>L</em>) still allows lim = <em>L</em>; a filled dot elsewhere is the function value, which can differ (removable hole).</li>
  </ol>
  <div class="ap-note"><strong>AP tip:</strong> On multiple choice, “limit exists” is about approach heights, not whether the point is defined.</div>
</div>
<div class="notes-block">
  <h3>Tables: estimating a limit numerically</h3>
  <p>Pick <em>x</em>-values closer and closer to <em>a</em> from left and right. If the <em>f</em>(<em>x</em>) values stabilize to one number, that’s your estimate of the limit. Tables never prove the limit — they suggest it.</p>
</div>`
};

j.notesData["1.2"] = {
  title: "1-5 to 1-7: Algebraic Limits (step-by-step)",
  content: `<div class="notes-block">
  <div class="subunit-tag">LIM-2 · Removing indeterminate forms</div>
  <h3>Always try direct substitution first</h3>
  <p>Plug <em>x</em> = <em>a</em> into the expression. If you get a real number (and no division by zero), <strong>that number is the limit</strong> — the function is continuous at that point for rational, polynomial, trig, exponential, and log expressions in their domains.</p>
</div>
<div class="notes-block">
  <h3>When you get <span style="font-family:var(--mono)">0/0</span> — the indeterminate form</h3>
  <p>You must <strong>rewrite</strong> the expression so substitution is no longer indeterminate. Common tools:</p>
  <ul style="line-height:1.65">
    <li><strong>Factor and cancel</strong> — especially difference of squares <em>x</em><sup>2</sup> − <em>a</em><sup>2</sup> = (<em>x</em> − <em>a</em>)(<em>x</em> + <em>a</em>), sum/difference of cubes, or common factors.</li>
    <li><strong>Rationalize</strong> — multiply numerator and denominator by a conjugate when you see √ inside a limit that goes to 0/0.</li>
    <li><strong>Common denominator</strong> — for limits of differences of fractions, combine into one fraction, then simplify.</li>
  </ul>
  <div class="definition-box"><div class="def-label">Worked style: rational with hole</div>
  <p>Find lim<sub><em>x</em>→3</sub> (<em>x</em><sup>2</sup> − 9)/(<em>x</em> − 3).</p>
  <p><strong>Step 1:</strong> Substitute: (9 − 9)/(3 − 3) → 0/0 → stop; need algebra.</p>
  <p><strong>Step 2:</strong> Factor: (<em>x</em> − 3)(<em>x</em> + 3)/(<em>x</em> − 3).</p>
  <p><strong>Step 3:</strong> Cancel (<em>x</em> − 3) for <em>x</em> ≠ 3: expression becomes <em>x</em> + 3.</p>
  <p><strong>Step 4:</strong> Substitute again: 3 + 3 = <strong>6</strong>.</p></div>
</div>
<div class="notes-block">
  <h3>Limits at infinity (rational functions)</h3>
  <p>Divide numerator and denominator by the <strong>highest power of <em>x</em></strong> in the denominator. Constants survive; terms like 1/<em>x</em> or 1/<em>x</em><sup>2</sup> go to 0 as <em>x</em> → ±∞.</p>
  <div class="formula-box">If degrees match: limit = ratio of leading coefficients. If denominator degree higher → 0. If numerator degree higher → ±∞ (watch signs).</div>
</div>
<div class="notes-block">
  <h3>One-sided limits and piecewise functions</h3>
  <p>Use the <strong>formula that applies on that side</strong> of the break. For continuity at a junction <em>x</em> = <em>c</em>, set left limit = right limit = <em>f</em>(<em>c</em>).</p>
  <div class="ap-note"><strong>AP tip:</strong> Show factoring or conjugate steps in free response — “plug in” alone earns no credit on 0/0 forms.</div>
</div>`
};

j.notesData["1.3"] = {
  title: "1-10 to 1-16: Continuity, asymptotes, IVT",
  content: `<div class="notes-block">
  <div class="subunit-tag">LIM-3 · Continuity</div>
  <h3>Continuity at a point <em>x</em> = <em>a</em></h3>
  <p>All three must hold:</p>
  <ol style="line-height:1.65">
    <li><em>f</em>(<em>a</em>) is defined (actual output exists).</li>
    <li>lim<sub><em>x</em>→<em>a</em></sub> <em>f</em>(<em>x</em>) exists (left = right).</li>
    <li>lim<sub><em>x</em>→<em>a</em></sub> <em>f</em>(<em>x</em>) = <em>f</em>(<em>a</em>).</li>
  </ol>
  <p><strong>Removable discontinuity:</strong> limit exists but ≠ defined value (or undefined) — fill the hole with that limit value to “remove” it.</p>
  <p><strong>Jump / infinite:</strong> non-removable.</p>
</div>
<div class="notes-block">
  <h3>Vertical asymptotes &amp; infinite limits</h3>
  <p>If substitution yields a nonzero over zero after simplifying, the limit is often ±∞. Check the <strong>sign</strong> of the factor approaching 0 from left vs right (sign chart or test values).</p>
</div>
<div class="notes-block">
  <h3>Horizontal asymptotes (end behavior)</h3>
  <p>Same toolkit as “limits at infinity” for rational functions. Compare degrees; horizontal asymptote is a line <em>y</em> = <em>L</em> if lim<sub><em>x</em>→±∞</sub> <em>f</em>(<em>x</em>) = <em>L</em>.</p>
</div>
<div class="notes-block">
  <h3>Intermediate Value Theorem (IVT)</h3>
  <div class="definition-box"><div class="def-label">Hypotheses</div>
  <p><em>f</em> is <strong>continuous</strong> on the closed interval [<em>a</em>, <em>b</em>]. <em>k</em> is any number strictly between <em>f</em>(<em>a</em>) and <em>f</em>(<em>b</em>).</p></div>
  <p><strong>Conclusion:</strong> There is at least one <em>c</em> in (<em>a</em>, <em>b</em>) with <em>f</em>(<em>c</em>) = <em>k</em>.</p>
  <div class="ap-note"><strong>Common mistake:</strong> IVT needs <strong>continuity on the whole closed interval</strong> you cite, not differentiability. Don’t confuse with MVT.</div>
</div>`
};

fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log("Patched unit1 notes 1.1–1.3.");
