/**
 * One-time / repeatable patch: replace notesData.content for units 2,3,4,5,9,10
 * with longer packet-style notes (definition-box, formula-box, ap-note, lists).
 * Run: node tools/apply-notes-expansion.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const patches = {
  "data/unit2.json": {
    "2.1": `<div class="notes-block">
  <div class="subunit-tag">CHA-2 · Rates of change</div>
  <h3>Average vs instantaneous rate</h3>
  <p>The <strong>average rate of change</strong> of <em>f</em> on [<em>a</em>, <em>b</em>] is the slope of the secant through (<em>a</em>, <em>f</em>(<em>a</em>)) and (<em>b</em>, <em>f</em>(<em>b</em>)). The <strong>instantaneous rate</strong> at <em>x</em> = <em>a</em> is the limit of those secant slopes as the interval shrinks — the derivative.</p>
  <div class="definition-box"><div class="def-label">Difference quotient</div>
  <p><strong>Average rate on [<em>a</em>, <em>a</em> + <em>h</em>]:</strong> (<em>f</em>(<em>a</em> + <em>h</em>) − <em>f</em>(<em>a</em>)) / <em>h</em>. Let <em>h</em> → 0 to read the instantaneous rate at <em>a</em>.</p></div>
  <div class="formula-box">f′(<em>a</em>) = lim<sub><em>h</em>→0</sub> (<em>f</em>(<em>a</em> + <em>h</em>) − <em>f</em>(<em>a</em>)) / <em>h</em> &nbsp; (derivative at a point)</div>
</div>
<div class="notes-block">
  <h3>Derivative = slope of tangent</h3>
  <p>Geometrically, f′(<em>a</em>) is the slope of the <strong>tangent line</strong> to <em>y</em> = <em>f</em>(<em>x</em>) at <em>x</em> = <em>a</em>. Equation: <em>y</em> − <em>f</em>(<em>a</em>) = f′(<em>a</em>)(<em>x</em> − <em>a</em>).</p>
</div>
<div class="notes-block">
  <h3>Differentiability ⇒ continuity</h3>
  <p>If <em>f</em> is differentiable at <em>a</em>, then <em>f</em> is continuous at <em>a</em>. The converse is false: vertical tangent, corner, cusp, or discontinuity ⇒ not differentiable there.</p>
  <div class="ap-note"><strong>AP tip:</strong> On graphs, estimate f′(<em>c</em>) with a short secant near <em>c</em> or by comparing rise/run along the curve; justify corners or vertical tangents in words.</div>
</div>`,
    "2.2": `<div class="notes-block">
  <div class="subunit-tag">FUN-3 · Basic differentiation</div>
  <h3>Power rule and constants</h3>
  <div class="formula-box">d/d<em>x</em>[<em>x</em><sup><em>n</em></sup>] = <em>n</em><em>x</em><sup><em>n</em>−1</sup> &nbsp;·&nbsp; d/d<em>x</em>[<em>c</em>] = 0 &nbsp;·&nbsp; d/d<em>x</em>[<em>c</em> · <em>f</em>] = <em>c</em> · f′</div>
  <p style="color:var(--text2)">Linearity: (<em>f</em> ± <em>g</em>)′ = f′ ± g′. Differentiate term by term after expanding products if needed.</p>
</div>
<div class="notes-block">
  <h3>Exponential and logarithm</h3>
  <div class="formula-box">d/d<em>x</em>[e<sup><em>x</em></sup>] = e<sup><em>x</em></sup> &nbsp;·&nbsp; d/d<em>x</em>[ln <em>x</em>] = 1/<em>x</em> (<em>x</em> &gt; 0) &nbsp;·&nbsp; d/d<em>x</em>[ln |<em>x</em>|] = 1/<em>x</em> (<em>x</em> ≠ 0)</div>
</div>
<div class="notes-block">
  <h3>Trig you must know cold</h3>
  <div class="formula-box">d/d<em>x</em>[sin <em>x</em>] = cos <em>x</em> &nbsp;·&nbsp; d/d<em>x</em>[cos <em>x</em>] = −sin <em>x</em> &nbsp;·&nbsp; d/d<em>x</em>[tan <em>x</em>] = sec²<em>x</em></div>
  <div class="ap-note"><strong>AP tip:</strong> Before chain rule piles on, drill these until they are automatic — every derivative of sin(<em>u</em>) is cos(<em>u</em>)·<em>u</em>′.</div>
</div>`,
    "2.3": `<div class="notes-block">
  <div class="subunit-tag">FUN-3 · Products, quotients, more trig</div>
  <h3>Product rule</h3>
  <div class="formula-box">(<em>f</em><em>g</em>)′ = f′<em>g</em> + <em>f</em>g′</div>
  <p style="color:var(--text2)">First times derivative of second <strong>plus</strong> second times derivative of first. For three factors, differentiate one factor at a time and add.</p>
</div>
<div class="notes-block">
  <h3>Quotient rule</h3>
  <div class="formula-box">(<em>f</em>/<em>g</em>)′ = (<em>f</em>′<em>g</em> − <em>f</em>g′) / <em>g</em>²</div>
  <p style="color:var(--text2)">“Low d-high minus high d-low, over low squared.” Watch subtraction order.</p>
</div>
<div class="notes-block">
  <h3>Sec, csc, cot</h3>
  <div class="formula-box">d/d<em>x</em>[sec <em>x</em>] = sec <em>x</em> tan <em>x</em> &nbsp;·&nbsp; d/d<em>x</em>[csc <em>x</em>] = −csc <em>x</em> cot <em>x</em> &nbsp;·&nbsp; d/d<em>x</em>[cot <em>x</em>] = −csc²<em>x</em></div>
  <div class="ap-note"><strong>AP tip:</strong> Simplify algebra before differentiating when you can; fewer layers means fewer sign errors.</div>
</div>`
  },
  "data/unit3.json": {
    "3.1": `<div class="notes-block">
  <div class="subunit-tag">FUN-3 · Composite functions</div>
  <h3>Chain rule (master pattern)</h3>
  <p>If <em>y</em> = <em>f</em>(<em>u</em>) and <em>u</em> = <em>g</em>(<em>x</em>), then dy/d<em>x</em> = <em>f</em>′(<em>u</em>) · <em>u</em>′. “Derivative of the outside (inside unchanged) × derivative of the inside.”</p>
  <div class="formula-box">d/d<em>x</em>[<em>f</em>(<em>g</em>(<em>x</em>))] = <em>f</em>′(<em>g</em>(<em>x</em>)) · <em>g</em>′(<em>x</em>)</div>
</div>
<div class="notes-block">
  <h3>Layered composition</h3>
  <ol style="line-height:1.65;color:var(--text2)">
    <li>Peel from the <strong>outside</strong> in: last operation applied is the outer function.</li>
    <li>Each nested layer contributes one factor of <em>u</em>′.</li>
    <li>Common shells: e<sup><em>u</em></sup>, ln <em>u</em>, sin <em>u</em>, (<em>u</em>)<sup><em>n</em></sup>, √<em>u</em>.</li>
  </ol>
  <div class="ap-note"><strong>AP tip:</strong> Missing <em>u</em>′ is the #1 chain-rule error. If the inside’s derivative is off by a constant, adjust with a constant multiple.</div>
</div>`,
    "3.2": `<div class="notes-block">
  <div class="subunit-tag">FUN-3 · Implicit relations</div>
  <h3>When <em>y</em> is defined implicitly</h3>
  <p>Differentiate <strong>both sides with respect to <em>x</em></strong>, remembering <em>y</em> = <em>y</em>(<em>x</em>). Every <em>y</em>-term uses the chain rule: d/d<em>x</em>[<em>y</em>²] = 2<em>y</em> · y′.</p>
  <div class="definition-box"><div class="def-label">Product with <em>y</em></div>
  <p>d/d<em>x</em>[<em>x</em><em>y</em>] = <em>y</em> + <em>x</em>y′ &nbsp; (product rule)</p></div>
</div>
<div class="notes-block">
  <h3>Solve for y′</h3>
  <p>Collect all terms containing y′ on one side, factor y′, divide. At a point (<em>x</em>₀, <em>y</em>₀), substitute to get a numeric slope for the tangent line.</p>
  <div class="ap-note"><strong>AP tip:</strong> Show implicit differentiation steps on FRQs; “just solve for <em>y</em>” is not always possible or faster.</div>
</div>`,
    "3.3": `<div class="notes-block">
  <div class="subunit-tag">FUN-3 · Inverses &amp; higher order</div>
  <h3>Derivative of an inverse</h3>
  <div class="formula-box">(<em>f</em>⁻¹)′(<em>b</em>) = 1 / <em>f</em>′(<em>a</em>) &nbsp; where <em>f</em>(<em>a</em>) = <em>b</em> and <em>f</em>′(<em>a</em>) ≠ 0</div>
  <p style="color:var(--text2)">Slopes of a function and its inverse at matching points are reciprocals (reflect across <em>y</em> = <em>x</em>).</p>
</div>
<div class="notes-block">
  <h3>Inverse trig derivatives (memorize)</h3>
  <div class="formula-box">d/d<em>x</em>[arcsin <em>x</em>] = 1/√(1−<em>x</em>²) &nbsp;·&nbsp; d/d<em>x</em>[arctan <em>x</em>] = 1/(1+<em>x</em>²) &nbsp;·&nbsp; d/d<em>x</em>[arccos <em>x</em>] = −1/√(1−<em>x</em>²)</div>
  <p>Derive from implicit diff on sin <em>y</em> = <em>x</em>, etc., if you forget — but speed matters on the exam.</p>
</div>
<div class="notes-block">
  <h3>Higher-order derivatives</h3>
  <p>f″(<em>x</em>) = d/d<em>x</em>(f′), f‴, and so on. Notation: d²<em>y</em>/d<em>x</em>². In motion, <em>s</em>″ is acceleration; in graphing, f″ controls concavity.</p>
  <div class="ap-note"><strong>AP tip:</strong> Simplify f′ before taking f″; messy algebra causes most second-derivative mistakes.</div>
</div>`
  },
  "data/unit4.json": {
    "4.1": `<div class="notes-block">
  <div class="subunit-tag">CHA-3 · Interpretation</div>
  <h3>Derivative as a contextual rate</h3>
  <p>If <em>Q</em>(<em>t</em>) is a quantity, <em>Q</em>′(<em>t</em>) is its <strong>instantaneous rate of change</strong> with respect to <em>t</em>. Units = (units of <em>Q</em>) per (units of <em>t</em>) — e.g. cm/min, liters/hr, people/year.</p>
  <div class="definition-box"><div class="def-label">Average vs instantaneous</div>
  <p>Average rate on [<em>a</em>, <em>b</em>]: (<em>Q</em>(<em>b</em>) − <em>Q</em>(<em>a</em>)) / (<em>b</em> − <em>a</em>). Instantaneous rate at <em>t</em>₀ is <em>Q</em>′(<em>t</em>₀).</p></div>
</div>
<div class="notes-block">
  <h3>Straight-line motion</h3>
  <p>Position <em>s</em>(<em>t</em>) → velocity <em>v</em>(<em>t</em>) = <em>s</em>′(<em>t</em>) → acceleration <em>a</em>(<em>t</em>) = <em>v</em>′(<em>t</em>) = <em>s</em>″(<em>t</em>). Sign of <em>v</em>: direction; sign of <em>a</em>: speeding up/slowing depends on pairing with <em>v</em>.</p>
  <div class="formula-box">Speed = |<em>v</em>(<em>t</em>)| &nbsp;·&nbsp; Distance traveled may need integrating |<em>v</em>| if direction changes</div>
</div>
<div class="notes-block">
  <h3>Other contexts</h3>
  <p>Population, temperature, cost, revenue — identify <strong>what</strong> is changing and <strong>with respect to what variable</strong>, then read “rate of change of …” as a derivative.</p>
  <div class="ap-note"><strong>AP tip:</strong> FRQs deduct for missing or wrong units; write complete sentences tying the derivative to the situation.</div>
</div>`,
    "4.2": `<div class="notes-block">
  <div class="subunit-tag">CHA-3 · Related rates</div>
  <h3>Standard setup</h3>
  <ol style="line-height:1.65;color:var(--text2)">
    <li>Draw a diagram; label all lengths, distances, or volumes that change with time.</li>
    <li>Write one <strong>constraint equation</strong> (geometry: Pythagoras, similar triangles, volume formulas).</li>
    <li>Differentiate <strong>with respect to <em>t</em></strong> — chain rule on every non-constant variable.</li>
    <li>Substitute numeric values <em>after</em> differentiating (unless a quantity is constant, derivative 0).</li>
  </ol>
</div>
<div class="notes-block">
  <h3>Common pitfall</h3>
  <p>Plugging numbers in <em>before</em> differentiating kills variable rates: if <em>r</em> and <em>h</em> both depend on <em>t</em>, both produce dr/d<em>t</em>, dh/d<em>t</em> terms.</p>
  <div class="ap-note"><strong>AP tip:</strong> State the equation, show the differentiated equation, then substitute — that order matches the rubric.</div>
</div>`,
    "4.3": `<div class="notes-block">
  <div class="subunit-tag">LIM-4 · Local linearity</div>
  <h3>Linearization</h3>
  <p>Near <em>x</em> = <em>a</em>, <em>f</em>(<em>x</em>) ≈ <em>L</em>(<em>x</em>) = <em>f</em>(<em>a</em>) + <em>f</em>′(<em>a</em>)(<em>x</em> − <em>a</em>), the tangent line. Good when <em>x</em> is close to <em>a</em>.</p>
  <div class="formula-box">Differential: d<em>y</em> ≈ <em>f</em>′(<em>a</em>) d<em>x</em> &nbsp; (approximate change in output from small change in input)</div>
</div>
<div class="notes-block">
  <h3>L’Hôpital’s rule</h3>
  <p>For limits of form 0/0 or ∞/∞ (after checking), differentiate <strong>numerator and denominator separately</strong> (not quotient rule), then retry. Repeat if still indeterminate.</p>
  <p style="color:var(--text2)">Sometimes algebra, conjugates, or ln first — rewrite into 0/0 or ∞/∞ before applying.</p>
  <div class="ap-note"><strong>AP tip:</strong> Verify hypotheses; if limit is not indeterminate, L’Hôpital does not apply.</div>
</div>`
  },
  "data/unit5.json": {
    "5.1": `<div class="notes-block">
  <div class="subunit-tag">FUN-4 · Extrema &amp; MVT</div>
  <h3>Extreme Value Theorem</h3>
  <p>If <em>f</em> is continuous on a <strong>closed</strong> interval [<em>a</em>, <em>b</em>], then <em>f</em> attains an absolute maximum and minimum on [<em>a</em>, <em>b</em>] (at critical points or endpoints).</p>
</div>
<div class="notes-block">
  <h3>Critical numbers</h3>
  <p>Interior points where f′(<em>c</em>) = 0 or f′(<em>c</em>) DNE are candidates for local extrema. Use the <strong>first derivative test</strong> (sign change of f′) or compare output values.</p>
  <div class="formula-box">Mean Value Theorem: if <em>f</em> continuous on [<em>a</em>, <em>b</em>] and differentiable on (<em>a</em>, <em>b</em>), ∃<em>c</em> in (<em>a</em>, <em>b</em>) with f′(<em>c</em>) = (<em>f</em>(<em>b</em>) − <em>f</em>(<em>a</em>)) / (<em>b</em> − <em>a</em>)</div>
</div>
<div class="notes-block">
  <h3>First derivative test</h3>
  <p>At a critical number <em>c</em>: f′ switches + → − ⇒ local max; − → + ⇒ local min; no sign change ⇒ not a local extremum.</p>
  <div class="ap-note"><strong>AP tip:</strong> For absolute extrema on [<em>a</em>, <em>b</em>], evaluate <em>f</em> at <strong>every</strong> critical number in the interval <strong>and</strong> at both endpoints.</div>
</div>`,
    "5.2": `<div class="notes-block">
  <div class="subunit-tag">FUN-4 · Concavity</div>
  <h3>Concavity from f″</h3>
  <p><strong>Concave up</strong>: graph opens upward (tangent below curve); typically f″ &gt; 0 on an interval. <strong>Concave down</strong>: f″ &lt; 0. These are sufficient conditions when f″ exists.</p>
</div>
<div class="notes-block">
  <h3>Inflection points</h3>
  <p>A point where concavity changes. Candidates: where f″(<em>x</em>) = 0 or f″ DNE — but you must confirm a <strong>sign change</strong> in f″ across the point.</p>
</div>
<div class="notes-block">
  <h3>Second derivative test</h3>
  <p>If f′(<em>c</em>) = 0 and f″(<em>c</em>) &gt; 0 ⇒ local min; f″(<em>c</em>) &lt; 0 ⇒ local max. If f″(<em>c</em>) = 0, <strong>inconclusive</strong> — use first derivative test.</p>
  <div class="ap-note"><strong>AP tip:</strong> Matching <em>f</em>, f′, f″ graphs: extrema of <em>f</em> where f′ crosses 0; inflection of <em>f</em> where f″ crosses 0.</div>
</div>`,
    "5.3": `<div class="notes-block">
  <div class="subunit-tag">FUN-4 · Optimization</div>
  <h3>Workflow</h3>
  <ol style="line-height:1.65;color:var(--text2)">
    <li>Identify the <strong>objective</strong> (maximize/minimize) and draw if helpful.</li>
    <li>Use a <strong>constraint</strong> to write the objective as a function of <strong>one variable</strong>.</li>
    <li>State the <strong>domain</strong> from the problem (lengths ≥ 0, etc.).</li>
    <li>Differentiate, find critical numbers <em>inside</em> the domain, compare with <strong>endpoints</strong> if the domain is closed.</li>
  </ol>
</div>
<div class="notes-block">
  <h3>Justify max or min</h3>
  <p>Use first or second derivative test, or argue from closed-interval candidate comparison. “It’s a max because it’s the largest value among …”</p>
  <div class="ap-note"><strong>AP tip:</strong> One-variable calculus requires eliminating extra variables via the constraint before differentiating.</div>
</div>`
  },
  "data/unit9.json": {
    "9.1": `<div class="notes-block">
  <div class="subunit-tag">FUN-8 · BC Parametric</div>
  <h3>Parametric curve</h3>
  <p>A curve is given by <em>x</em> = <em>x</em>(<em>t</em>), <em>y</em> = <em>y</em>(<em>t</em>). The parameter <em>t</em> might be time; the path can loop or reverse — <em>t</em> is not the <em>x</em>-coordinate.</p>
  <div class="formula-box">d<em>y</em>/d<em>x</em> = (d<em>y</em>/d<em>t</em>) / (d<em>x</em>/d<em>t</em>) &nbsp; provided d<em>x</em>/d<em>t</em> ≠ 0</div>
</div>
<div class="notes-block">
  <h3>Tangent lines &amp; horizontal/vertical</h3>
  <p>Point: (<em>x</em>(<em>t</em>₀), <em>y</em>(<em>t</em>₀)). Slope = d<em>y</em>/d<em>x</em> above. Horizontal tangent when d<em>y</em>/d<em>t</em> = 0 and d<em>x</em>/d<em>t</em> ≠ 0; vertical when d<em>x</em>/d<em>t</em> = 0 and d<em>y</em>/d<em>t</em> ≠ 0.</p>
  <div class="formula-box">Arc length (BC): ∫ √((d<em>x</em>/d<em>t</em>)² + (d<em>y</em>/d<em>t</em>)²) d<em>t</em> &nbsp;·&nbsp; Speed = √((d<em>x</em>/d<em>t</em>)² + (d<em>y</em>/d<em>t</em>)²)</div>
  <div class="ap-note"><strong>AP tip:</strong> Simplify d<em>y</em>/d<em>x</em> before evaluating at <em>t</em>₀; watch for where d<em>x</em>/d<em>t</em> = 0.</div>
</div>`,
    "9.2": `<div class="notes-block">
  <div class="subunit-tag">FUN-8 · Parametric concavity</div>
  <h3>Second derivative d²<em>y</em>/d<em>x</em>²</h3>
  <p>First compute d<em>y</em>/d<em>x</em> as a function of <em>t</em>. Then</p>
  <div class="formula-box">d²<em>y</em>/d<em>x</em>² = (d/d<em>t</em>)(d<em>y</em>/d<em>x</em>) ÷ (d<em>x</em>/d<em>t</em>)</div>
  <p style="color:var(--text2)">Do <strong>not</strong> “square” the first derivative. This is a quotient of derivatives with respect to <em>t</em>.</p>
</div>
<div class="notes-block">
  <h3>Interpretation</h3>
  <p>Sign of d²<em>y</em>/d<em>x</em>² tells concavity of the <em>y</em>-vs-<em>x</em> graph along the path (how the curve bends in the plane).</p>
  <div class="ap-note"><strong>AP tip:</strong> Differentiate (d<em>y</em>/d<em>x</em>) with respect to <em>t</em> using quotient/product rules as needed, then divide by d<em>x</em>/d<em>t</em>.</div>
</div>`,
    "9.3": `<div class="notes-block">
  <div class="subunit-tag">FUN-8 · BC Polar</div>
  <h3>Polar ↔ rectangular</h3>
  <div class="formula-box"><em>x</em> = <em>r</em> cos θ, &nbsp; <em>y</em> = <em>r</em> sin θ &nbsp; with <em>r</em> = <em>f</em>(θ)</div>
  <p>Differentiate <em>x</em> and <em>y</em> with respect to θ using product rule; then dy/d<em>x</em> = (d<em>y</em>/dθ)/(d<em>x</em>/dθ).</p>
</div>
<div class="notes-block">
  <h3>Area bounded by one polar graph</h3>
  <div class="formula-box">Area = ½ ∫<sub>α</sub><sup>β</sup> <em>r</em>² dθ</div>
  <p style="color:var(--text2)">Use when the region is swept by a single <em>r</em> = <em>f</em>(θ) between rays θ = α and θ = β. For loops and petals, choose α, β so you trace the boundary once.</p>
</div>
<div class="notes-block">
  <h3>Strategy</h3>
  <p>Sketch <em>r</em> vs θ or the polar curve; identify symmetry to reduce the integral. Watch for negative <em>r</em> (reflection through origin).</p>
  <div class="ap-note"><strong>AP tip:</strong> Double-check θ-bounds against the graph — especially roses, limaçons, and spirals.</div>
</div>`
  },
  "data/unit10.json": {
    "10.1": `<div class="notes-block">
  <div class="subunit-tag">LIM-7 · BC Sequences</div>
  <h3>Sequences</h3>
  <p>A sequence {a<sub><em>n</em></sub>} is an ordered list. It <strong>converges</strong> to <em>L</em> if a<sub><em>n</em></sub> can be made arbitrarily close to <em>L</em> by taking <em>n</em> large enough.</p>
</div>
<div class="notes-block">
  <h3>Series and partial sums</h3>
  <p>A <strong>series</strong> Σ<sub><em>n</em>=1</sub><sup>∞</sup> a<sub><em>n</em></sub> is the limit of its partial sums S<sub><em>N</em></sub> = Σ<sub><em>n</em>=1</sub><sup><em>N</em></sup> a<sub><em>n</em></sub>. If S<sub><em>N</em></sub> → finite limit, the series converges.</p>
  <div class="definition-box"><div class="def-label">nth-term test (divergence)</div>
  <p>If lim<sub><em>n</em>→∞</sub> a<sub><em>n</em></sub> ≠ 0, then Σ a<sub><em>n</em></sub> diverges. If the limit is 0, the series may still diverge — this never proves convergence.</p></div>
  <div class="ap-note"><strong>AP tip:</strong> Name every test you use; show the limit in the nth-term test explicitly.</div>
</div>`,
    "10.2": `<div class="notes-block">
  <div class="subunit-tag">LIM-7 · Benchmark series</div>
  <h3>Geometric series</h3>
  <div class="formula-box">Σ <em>ar</em><sup><em>n</em></sup> (from <em>n</em> = 0 or 1 — watch the index) converges if |<em>r</em>| &lt; 1 to <em>a</em><sub>first</sub>/(1−<em>r</em>); diverges if |<em>r</em>| ≥ 1</div>
</div>
<div class="notes-block">
  <h3><em>p</em>-series</h3>
  <div class="formula-box">Σ 1/<em>n</em><sup><em>p</em></sup> converges if <em>p</em> &gt; 1; diverges if 0 &lt; <em>p</em> ≤ 1</div>
  <p style="color:var(--text2)">Harmonic series Σ 1/<em>n</em> diverges (<em>p</em> = 1). These anchor comparison and limit comparison tests.</p>
</div>
<div class="notes-block">
  <h3>Integral test (idea)</h3>
  <p>If <em>f</em>(<em>x</em>) is positive, continuous, and decreasing for <em>x</em> ≥ 1 and a<sub><em>n</em></sub> = <em>f</em>(<em>n</em>), then Σ a<sub><em>n</em></sub> and ∫<sub>1</sub><sup>∞</sup> <em>f</em>(<em>x</em>) d<em>x</em> share convergence behavior.</p>
  <div class="ap-note"><strong>AP tip:</strong> Memorize geometric and <em>p</em>-series conclusions cold; most other series are compared to them.</div>
</div>`,
    "10.3": `<div class="notes-block">
  <div class="subunit-tag">LIM-7 · Convergence tests</div>
  <h3>Alternating series test</h3>
  <p>For Σ (−1)<sup><em>n</em></sup> b<sub><em>n</em></sub> with b<sub><em>n</em></sub> &gt; 0: if b<sub><em>n</em></sub> is eventually decreasing and b<sub><em>n</em></sub> → 0, the series <strong>converges</strong> (often conditionally).</p>
</div>
<div class="notes-block">
  <h3>Ratio test</h3>
  <p>Let <em>L</em> = lim<sub><em>n</em>→∞</sub> |a<sub><em>n</em>+1</sub>/a<sub><em>n</em></sub>|. <em>L</em> &lt; 1 ⇒ absolute convergence; <em>L</em> &gt; 1 ⇒ divergence; <em>L</em> = 1 ⇒ inconclusive.</p>
</div>
<div class="notes-block">
  <h3>Absolute vs conditional</h3>
  <p>If Σ|a<sub><em>n</em></sub>| converges, Σa<sub><em>n</em></sub> converges <strong>absolutely</strong>. If Σ|a<sub><em>n</em></sub>| diverges but Σa<sub><em>n</em></sub> converges, convergence is <strong>conditional</strong>.</p>
  <div class="ap-note"><strong>AP tip:</strong> Alternating series error bound: remainder |<em>R</em><sub><em>N</em></sub>| ≤ b<sub><em>N</em>+1</sub> under AST hypotheses.</div>
</div>`
  }
};

for (const [rel, sections] of Object.entries(patches)) {
  const fp = path.join(root, rel);
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!j.notesData) {
    console.warn("skip (no notesData):", rel);
    continue;
  }
  for (const [key, html] of Object.entries(sections)) {
    if (!j.notesData[key]) {
      console.warn("missing key", rel, key);
      continue;
    }
    j.notesData[key].content = html;
  }
  fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n");
  console.log("patched", rel);
}
