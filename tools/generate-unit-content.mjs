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

function mcq(section, topic, question, choices, correct, explanation, notesSection, notesSnippet, timeTip, calcType = "No Calculator") {
  return { section, topic, calcType, question, choices, correct, explanation, notesSection, notesSnippet, timeTip };
}

const unitContent = {
  1: {
    sections: ["1.1", "1.2", "1.3", "1.4", "1.5"],
    questionBank: [
      mcq("1.1", "Graphical Limits", "If f(x) approaches 4 as x approaches 2 from both sides, what is lim_{x->2} f(x)?", { A: "2", B: "4", C: "Does not exist", D: "Infinity" }, "B", "When both one-sided limits are 4, the two-sided limit is 4.", "1.1 - Graphical Limits", "A two-sided limit exists when left and right limits match.", "Check left and right behavior first."),
      mcq("1.2", "Limit Notation", "If lim_{x->3} (2x+5) is evaluated by direct substitution, the value is:", { A: "6", B: "10", C: "11", D: "Cannot be found" }, "C", "2(3)+5 = 11.", "1.2 - Algebraic Limits", "Direct substitution works for polynomials and continuous expressions.", "Substitute directly unless indeterminate."),
      mcq("1.3", "Limits from Tables", "A table shows f(x) values near x=1 approaching 7 from both sides. Best conclusion?", { A: "f(1)=7 always", B: "lim_{x->1}f(x)=7", C: "No limit exists", D: "f is linear" }, "B", "A two-sided approach to 7 supports lim_{x->1} f(x)=7.", "1.3 - Numerical Limits", "Tables estimate limits using nearby values, not necessarily f(1).", "Limit value and function value can differ."),
      mcq("1.4", "Continuity", "Which condition is required for f to be continuous at x=a?", { A: "f'(a) exists", B: "lim_{x->a}f(x)=f(a)", C: "f''(a)=0", D: "f(a)=0" }, "B", "Continuity at a means the limit exists and equals the function value.", "1.4 - Continuity", "Definition: f is continuous at a if lim f(x)=f(a).", "Memorize the exact continuity definition."),
      mcq("1.5", "Infinite Limits", "If lim_{x->2^-} f(x)=+infinity and lim_{x->2^+} f(x)=+infinity, then x=2 is:", { A: "Horizontal asymptote", B: "Inflection point", C: "Vertical asymptote", D: "Endpoint" }, "C", "Both sides blowing up at x=2 indicates a vertical asymptote x=2.", "1.5 - Asymptotes", "Infinite behavior at finite x indicates vertical asymptotes.", "Use asymptote language precisely.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 1 FRQ - Limits and Continuity",
        context: "A function g is defined by g(x)=(x^2-4)/(x-2) for x!=2 and g(2)=k.",
        parts: [
          { label: "(a)", points: 3, question: "Find lim_{x->2} g(x).", finalAnswer: "4", steps: ["Factor x^2-4=(x-2)(x+2).", "For x!=2, g(x)=x+2.", "lim_{x->2} g(x)=4."], scoring: "1 pt factor, 1 pt simplification, 1 pt limit." },
          { label: "(b)", points: 2, question: "Find k so g is continuous at x=2.", finalAnswer: "k=4", steps: ["Continuity requires g(2)=lim_{x->2}g(x).", "Set k=4."], scoring: "1 pt continuity condition, 1 pt value." }
        ]
      }
    ],
    notesData: {
      "1.1": { title: "1-1 to 1-4: Limits from Graphs and Tables", content: "<div class='notes-block'><h3>Core idea</h3><p>A limit is the value f(x) approaches as x approaches a number. Check left and right behavior.</p><div class='formula-box'>lim_{x->a} f(x) exists only if left limit = right limit.</div></div>" },
      "1.2": { title: "1-5 to 1-7: Algebraic Limit Tools", content: "<div class='notes-block'><h3>Algebra first</h3><p>Use substitution, factoring, common denominators, and rationalizing to remove 0/0 forms.</p></div>" },
      "1.3": { title: "1-10 to 1-16: Continuity and Asymptotes", content: "<div class='notes-block'><h3>Continuity checklist</h3><ul><li>f(a) exists</li><li>lim_{x->a} f(x) exists</li><li>limit equals f(a)</li></ul></div>" }
    }
  },
  2: {
    sections: ["2.1", "2.2", "2.3", "2.4", "2.5"],
    questionBank: [
      mcq("2.1", "Derivative Definition", "Using definition, d/dx(x^2) equals:", { A: "x", B: "2x", C: "x^2", D: "2" }, "B", "The derivative of x^2 is 2x.", "2.1 - Definition of Derivative", "Difference quotient limit gives 2x.", "For basics, recall power rule quickly."),
      mcq("2.2", "Tangent Lines", "If f(1)=3 and f'(1)=5, equation of tangent line at x=1 is:", { A: "y=5x+3", B: "y-3=5(x-1)", C: "y-1=5(x-3)", D: "y=3x+5" }, "B", "Point-slope form with point (1,3) and slope 5.", "2.2 - Tangent Lines", "Tangent line uses y-f(a)=f'(a)(x-a).", "Write point-slope before simplifying."),
      mcq("2.3", "Differentiability", "If f is differentiable at x=a, which is true?", { A: "f is discontinuous", B: "f is continuous", C: "f has vertical asymptote", D: "f(a)=0" }, "B", "Differentiability implies continuity.", "2.3 - Differentiability", "Differentiable => continuous (converse not always true).", "Remember one-way implication."),
      mcq("2.4", "Product Rule", "d/dx[(x^2)(sin x)] =", { A: "2x sin x + x^2 cos x", B: "2x cos x", C: "x^2 cos x", D: "2x sin x" }, "A", "Product rule: (uv)'=u'v+uv'.", "2.4 - Product Rule", "Differentiate each factor once and add.", "Keep terms in original order to avoid sign errors."),
      mcq("2.5", "Quotient Rule", "d/dx[(x^2+1)/x] for x!=0 is:", { A: "(2x*x-(x^2+1))/x^2", B: "2x/x", C: "(x^2+1)'/x", D: "1/x^2" }, "A", "Quotient rule: (u'v-uv')/v^2.", "2.5 - Quotient Rule", "Use u=x^2+1 and v=x.", "Write u and v before differentiating.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 2 FRQ - Derivative Skills",
        context: "Let f(x)=x^3-3x.",
        parts: [
          { label: "(a)", points: 3, question: "Find f'(x).", finalAnswer: "f'(x)=3x^2-3", steps: ["Power rule on x^3 gives 3x^2.", "Derivative of -3x is -3.", "Combine terms."], scoring: "1 pt each term, 1 pt final." },
          { label: "(b)", points: 3, question: "Find tangent line to f at x=2.", finalAnswer: "y=9x-16", steps: ["f(2)=8-6=2.", "f'(2)=12-3=9.", "y-2=9(x-2), so y=9x-16."], scoring: "1 pt point, 1 pt slope, 1 pt line." }
        ]
      }
    ],
    notesData: {
      "2.1": { title: "2-1 to 2-4: Derivative Foundations", content: "<div class='notes-block'><h3>Derivative meaning</h3><p>Derivative is instantaneous rate of change and slope of tangent line.</p></div>" },
      "2.2": { title: "2-5 to 2-7: Basic Rules", content: "<div class='notes-block'><h3>Power + basic derivatives</h3><p>Know derivatives of powers, trig basics, and exponentials.</p></div>" },
      "2.3": { title: "2-8 to 2-10: Product, Quotient, Trig", content: "<div class='notes-block'><h3>Rule selection</h3><p>Choose product/quotient rules when functions are multiplied/divided.</p></div>" }
    }
  },
  3: {
    sections: ["3.1", "3.2", "3.3", "3.4", "3.5"],
    questionBank: [
      mcq("3.1", "Chain Rule", "If y=(3x^2+1)^5, then y'=", { A: "5(3x^2+1)^4", B: "30x(3x^2+1)^4", C: "6x(3x^2+1)^5", D: "15x(3x^2+1)^5" }, "B", "Chain rule: outer derivative times inner derivative 6x.", "3.1 - Chain Rule", "Differentiate outside, keep inside, multiply by inside derivative.", "Outer-then-inner method prevents mistakes."),
      mcq("3.2", "Implicit Differentiation", "If x^2+y^2=25, then dy/dx=", { A: "-x/y", B: "x/y", C: "-y/x", D: "2x+2y" }, "A", "Differentiate: 2x+2y y' =0, so y'=-x/y.", "3.2 - Implicit Differentiation", "Treat y as y(x), so derivative of y^2 is 2y y'.", "Never forget y' factor."),
      mcq("3.3", "Inverse Functions", "If f and f^{-1} are inverses and f(2)=5, f'(2)=4, then (f^{-1})'(5)=", { A: "4", B: "1/4", C: "1/5", D: "5/4" }, "B", "Derivative of inverse: (f^{-1})'(b)=1/f'(a) where f(a)=b.", "3.3 - Inverse Function Derivatives", "Swap input/output point, then reciprocal slope.", "Match the point carefully before reciprocal."),
      mcq("3.4", "Inverse Trig", "d/dx[arctan x] =", { A: "1/(1-x^2)", B: "1/(1+x^2)", C: "sec^2 x", D: "-1/sqrt(1-x^2)" }, "B", "Standard derivative formula for arctan x.", "3.4 - Inverse Trig", "Memorize inverse trig derivative formulas.", "This is a common AP quick point."),
      mcq("3.5", "Higher Derivatives", "If f(x)=x^3, then f''(x)=", { A: "3x^2", B: "6x", C: "3x", D: "6" }, "B", "First derivative 3x^2, second derivative 6x.", "3.5 - Higher Order Derivatives", "Second derivative is derivative of first derivative.", "Differentiate step-by-step.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 3 FRQ - Chain and Implicit",
        context: "Let y satisfy x^2y + y^3 = 10.",
        parts: [
          { label: "(a)", points: 4, question: "Find dy/dx in terms of x and y.", finalAnswer: "dy/dx = -2xy/(x^2+3y^2)", steps: ["Differentiate both sides: 2xy + x^2y' + 3y^2y' = 0.", "Group y' terms: (x^2+3y^2)y' = -2xy.", "Solve for y'."], scoring: "1 pt implicit setup, 1 pt combine, 1 pt isolate, 1 pt final." }
        ]
      }
    ],
    notesData: {
      "3.1": { title: "3-1 Chain Rule", content: "<div class='notes-block'><h3>Chain Rule</h3><div class='formula-box'>(f(g(x)))' = f'(g(x))g'(x)</div></div>" },
      "3.2": { title: "3-2 Implicit Differentiation", content: "<div class='notes-block'><h3>Implicit</h3><p>Differentiate both sides and include y' whenever you differentiate y-terms.</p></div>" },
      "3.3": { title: "3-3 to 3-5 Inverse + Higher Derivatives", content: "<div class='notes-block'><h3>Inverse slope rule</h3><p>(f^{-1})'(b)=1/f'(a), where f(a)=b.</p></div>" }
    }
  },
  4: {
    sections: ["4.1", "4.2", "4.3", "4.4", "4.5"],
    questionBank: [
      mcq("4.1", "Derivative in Context", "If s(t) is position (meters), what are units of s'(t)?", { A: "meters", B: "meters/second", C: "seconds/meter", D: "meters/second^2" }, "B", "Derivative of position with respect to time is velocity.", "4.1 - Rates in Context", "Units follow output/input: meters per second.", "Always track units for context questions."),
      mcq("4.2", "Motion", "If v(t)=3t^2-6t, then acceleration a(t)=", { A: "3t^2-6t", B: "6t-6", C: "6t", D: "3t-6" }, "B", "Acceleration is derivative of velocity.", "4.2 - Straight Line Motion", "a(t)=v'(t).", "Differentiate once more."),
      mcq("4.3", "Related Rates", "For A=pi r^2, if dr/dt=2 and r=3, then dA/dt=", { A: "6pi", B: "9pi", C: "12pi", D: "18pi" }, "C", "dA/dt = 2pi r dr/dt = 2pi(3)(2)=12pi.", "4.3 - Related Rates", "Differentiate equation with respect to time.", "Substitute values only after differentiating."),
      mcq("4.4", "Linearization", "Linearization of f at x=a is:", { A: "f(a)+f'(a)(x-a)", B: "f'(a)+f(a)(x-a)", C: "f(a)(x-a)", D: "f''(a)(x-a)^2" }, "A", "The tangent-line approximation formula.", "4.4 - Linearization", "Use tangent line to approximate nearby values.", "Know L(x)=f(a)+f'(a)(x-a)."),
      mcq("4.5", "L'Hospital", "L'Hospital's Rule applies directly to which form?", { A: "1^infinity", B: "infinity-infinity", C: "0/0", D: "a+b" }, "C", "Rule applies to 0/0 or infinity/infinity quotient forms.", "4.5 - L'Hospital", "Convert to quotient if needed before using.", "Check indeterminate form first.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 4 FRQ - Motion and Rates",
        context: "A particle moves on a line with position s(t)=t^3-6t^2+9t.",
        parts: [
          { label: "(a)", points: 3, question: "Find velocity v(t) and acceleration a(t).", finalAnswer: "v(t)=3t^2-12t+9, a(t)=6t-12", steps: ["Differentiate s(t) for v(t).", "Differentiate v(t) for a(t)."], scoring: "1 pt velocity, 1 pt acceleration, 1 pt correct simplification." },
          { label: "(b)", points: 3, question: "Find times when particle is at rest.", finalAnswer: "t=1 and t=3", steps: ["Set v(t)=0: 3t^2-12t+9=0.", "Divide by 3: t^2-4t+3=(t-1)(t-3)=0.", "So t=1,3."], scoring: "1 pt equation, 1 pt factoring, 1 pt roots." }
        ]
      }
    ],
    notesData: {
      "4.1": { title: "4-1 to 4-3 Rates in Context", content: "<div class='notes-block'><h3>Units matter</h3><p>Always state units for derivatives in applied contexts.</p></div>" },
      "4.2": { title: "4-4 Related Rates", content: "<div class='notes-block'><h3>Workflow</h3><p>Write equation, differentiate with respect to time, then substitute known values.</p></div>" },
      "4.3": { title: "4-6 and 4-7 Approximation + L'Hospital", content: "<div class='notes-block'><h3>Approximation tools</h3><p>Use linearization for nearby estimates and L'Hospital for qualifying indeterminate forms.</p></div>" }
    }
  },
  5: {
    sections: ["5.1", "5.3", "5.4", "5.6", "5.10"],
    questionBank: [
      mcq("5.1", "Mean Value Theorem", "If f is continuous on [a,b] and differentiable on (a,b), MVT guarantees:", { A: "f(a)=f(b)", B: "exists c with f'(c)=(f(b)-f(a))/(b-a)", C: "f'(x)=0 for all x", D: "f is linear" }, "B", "This is the exact MVT statement.", "5.1 - MVT", "MVT links average rate to an instantaneous rate.", "Quote theorem conditions first."),
      mcq("5.3", "Increasing/Decreasing", "If f'(x)>0 on an interval, f is:", { A: "decreasing", B: "constant", C: "increasing", D: "undefined" }, "C", "Positive derivative means function is increasing.", "5.3 - First Derivative Test", "Sign of f' controls monotonicity.", "Make a sign chart."),
      mcq("5.4", "Relative Extrema", "A relative max can occur where:", { A: "f' changes + to -", B: "f' changes - to +", C: "f'' always positive", D: "f'=2" }, "A", "Max occurs when slope switches from positive to negative.", "5.4 - Relative Extrema", "Use first derivative sign changes at critical points.", "Track sign before and after c."),
      mcq("5.6", "Concavity", "If f''(x)<0 on an interval, graph of f is:", { A: "concave up", B: "concave down", C: "linear", D: "always decreasing" }, "B", "Negative second derivative means concave down.", "5.6 - Concavity", "Second derivative sign controls concavity.", "Keep separate from increasing/decreasing."),
      mcq("5.10", "Optimization", "To maximize area with constraints, best AP strategy is:", { A: "Guess values", B: "Set derivative equal to 0 after reducing to one variable", C: "Set second derivative to 1", D: "Integrate first" }, "B", "Optimization: model objective in one variable, then critical points.", "5.10 - Optimization", "Build objective function then analyze derivative.", "Define variables before equations.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 5 FRQ - Graph Analysis and Optimization",
        context: "Let f(x)=x^3-6x^2+9x+1.",
        parts: [
          { label: "(a)", points: 3, question: "Find critical points of f.", finalAnswer: "x=1 and x=3", steps: ["f'(x)=3x^2-12x+9=3(x-1)(x-3).", "Set f'(x)=0.", "Critical points at x=1,3."], scoring: "1 pt derivative, 1 pt equation, 1 pt roots." },
          { label: "(b)", points: 3, question: "Classify each critical point.", finalAnswer: "x=1 is local max, x=3 is local min", steps: ["Use sign chart for f'.", "f' changes + to - at x=1 => max.", "f' changes - to + at x=3 => min."], scoring: "1 pt sign method, 1 pt x=1 class, 1 pt x=3 class." }
        ]
      }
    ],
    notesData: {
      "5.1": { title: "5-1 to 5-5 Extrema and MVT", content: "<div class='notes-block'><h3>Critical-point workflow</h3><p>Find f', solve f'=0/undefined, then classify using sign changes.</p></div>" },
      "5.2": { title: "5-6 Concavity + 2nd Derivative Test", content: "<div class='notes-block'><h3>Concavity</h3><p>f''>0 concave up, f''<0 concave down. Inflection where concavity changes.</p></div>" },
      "5.3": { title: "5-10 Optimization", content: "<div class='notes-block'><h3>Optimization strategy</h3><p>Objective function -> one variable -> derivative -> test candidates.</p></div>" }
    }
  },
  9: {
    sections: ["9.1", "9.2", "9.3", "9.4"],
    questionBank: [
      mcq("9.1", "Parametric Derivatives", "If x=t^2 and y=t^3, then dy/dx=", { A: "3t^2", B: "2t", C: "(dy/dt)/(dx/dt)=3t/2", D: "t/2" }, "C", "dy/dx = (3t^2)/(2t)=3t/2 for t!=0.", "9.1 - Parametric Equations", "For parametric curves, divide derivatives with respect to t.", "Compute dx/dt and dy/dt separately."),
      mcq("9.2", "Second Derivative Parametric", "For parametric x(t),y(t), d^2y/dx^2 equals:", { A: "d/dt(dy/dx)", B: "(d/dt(dy/dx))/(dx/dt)", C: "(dy/dt)/(d^2x/dt^2)", D: "d^2y/dt^2" }, "B", "Second derivative in parametric form divides by dx/dt again.", "9.2 - Parametric Concavity", "Apply chain rule with respect to x via t.", "Write formula before plugging numbers."),
      mcq("9.3", "Polar Area", "Area enclosed by r=f(theta) from a to b is:", { A: "int_a^b r dtheta", B: "(1/2)int_a^b r^2 dtheta", C: "pi r^2", D: "int_a^b r^2 dr" }, "B", "Polar area formula is one-half integral of r^2.", "9.3 - Polar Area", "Use theta bounds and square r.", "Do not forget the 1/2."),
      mcq("9.4", "Polar Slope", "If x=r cos theta and y=r sin theta, then dy/dx=", { A: "(dy/dtheta)/(dx/dtheta)", B: "dy/dr", C: "dx/dy", D: "tan(theta)" }, "A", "Differentiate x and y with respect to theta then divide.", "9.4 - Polar Derivatives", "Polar slope parallels parametric slope idea.", "Treat theta as parameter."),
      mcq("9.3", "Polar Area Quick", "If r=2 on 0<=theta<=pi, area is:", { A: "2pi", B: "pi", C: "4pi", D: "8pi" }, "A", "A=(1/2)int_0^pi 4 dtheta=(1/2)(4pi)=2pi.", "9.3 - Polar Area", "Constant radius still uses polar area formula.", "Integrate over theta interval.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: true,
        title: "Unit 9 FRQ - Parametric and Polar",
        context: "A curve is given parametrically by x=t^2+1, y=t^3-3t.",
        parts: [
          { label: "(a)", points: 3, question: "Find dy/dx at t=2.", finalAnswer: "9/4", steps: ["dx/dt=2t, dy/dt=3t^2-3.", "At t=2: dx/dt=4, dy/dt=9.", "dy/dx=9/4."], scoring: "1 pt derivatives, 1 pt substitution, 1 pt ratio." },
          { label: "(b)", points: 3, question: "Find equation of tangent line at t=2.", finalAnswer: "y-2=(9/4)(x-5)", steps: ["Point at t=2: x=5, y=2.", "Slope from part (a) is 9/4.", "Use point-slope form."], scoring: "1 pt point, 1 pt slope, 1 pt equation." }
        ]
      }
    ],
    notesData: {
      "9.1": { title: "9.1 Parametric Basics", content: "<div class='notes-block'><h3>Core formulas</h3><p>dy/dx=(dy/dt)/(dx/dt), and tangent lines use parametric point + slope.</p></div>" },
      "9.2": { title: "9.2 Higher Parametric Derivatives", content: "<div class='notes-block'><h3>Second derivative</h3><div class='formula-box'>d^2y/dx^2 = (d/dt(dy/dx)) / (dx/dt)</div></div>" },
      "9.3": { title: "9.3-9.4 Polar Area and Slope", content: "<div class='notes-block'><h3>Polar AP formulas</h3><p>Area = 1/2 int r^2 dtheta, slope uses x(theta), y(theta) derivatives.</p></div>" }
    }
  },
  10: {
    sections: ["10.1", "10.2", "10.3", "10.4", "10.5"],
    questionBank: [
      mcq("10.1", "Series Basics", "The nth partial sum of sum a_n is:", { A: "S_n = a_n", B: "S_n = a_1+...+a_n", C: "S_n = a_n-a_{n-1}", D: "S_n = int a_n" }, "B", "By definition, partial sum adds first n terms.", "10.1 - Sequences and Series", "Partial sums determine convergence behavior.", "Write first few terms to avoid confusion."),
      mcq("10.2", "Geometric Series", "sum_{n=0}^infinity (1/3)^n converges to:", { A: "1/2", B: "3/2", C: "1", D: "Diverges" }, "B", "Infinite geometric sum is 1/(1-r)=1/(1-1/3)=3/2.", "10.2 - Geometric Series", "Use |r|<1 and a/(1-r).", "Identify a and r carefully."),
      mcq("10.3", "p-Series", "sum 1/n^p converges when:", { A: "p<=1", B: "p>1", C: "p=1 only", D: "always" }, "B", "p-series converges iff p>1.", "10.3 - p-Series", "This is a must-memorize test.", "Compare quickly to p=1 benchmark."),
      mcq("10.4", "Alternating Series", "Alternating series test requires:", { A: "terms increase", B: "terms decrease to 0 in magnitude", C: "all terms positive", D: "ratio less than 1 always" }, "B", "Need decreasing positive b_n and lim b_n=0.", "10.4 - Alternating Series Test", "Check monotonic decrease and limit zero.", "Separate sign pattern from magnitude."),
      mcq("10.5", "Ratio Test", "If lim |a_{n+1}/a_n| = L < 1, then series:", { A: "diverges", B: "converges absolutely", C: "conditionally converges", D: "inconclusive" }, "B", "Ratio test with L<1 gives absolute convergence.", "10.5 - Ratio Test", "Use ratio on factorial/exponential patterns.", "Interpret L in three cases: <1, >1, =1.")
    ],
    frqBank: [
      {
        id: 0,
        calcAllowed: false,
        title: "Unit 10 FRQ - Series Tests",
        context: "Consider sum_{n=1}^infinity ((-1)^{n+1})/n^2.",
        parts: [
          { label: "(a)", points: 3, question: "Determine whether the series converges absolutely, conditionally, or diverges.", finalAnswer: "Converges absolutely", steps: ["Check absolute series sum 1/n^2.", "p-series with p=2 converges.", "Therefore original alternating series converges absolutely."], scoring: "1 pt absolute series setup, 1 pt test, 1 pt classification." },
          { label: "(b)", points: 2, question: "Is the alternating series error after n terms at most the first omitted term?", finalAnswer: "Yes, when terms decrease to 0 in magnitude.", steps: ["Alternating series error bound applies to decreasing b_n -> 0.", "Then |R_n| <= b_{n+1}."], scoring: "1 pt condition, 1 pt bound statement." }
        ]
      }
    ],
    notesData: {
      "10.1": { title: "10.1 Sequences and Partial Sums", content: "<div class='notes-block'><h3>Sequence vs series</h3><p>A sequence is list of terms. A series is sum of terms.</p></div>" },
      "10.2": { title: "10.2 Geometric and p-Series", content: "<div class='notes-block'><h3>Fast tests</h3><p>Geometric needs |r|<1. p-series converges iff p>1.</p></div>" },
      "10.3": { title: "10.3-10.5 Alternating + Ratio", content: "<div class='notes-block'><h3>Common AP convergence tests</h3><p>Alternating test, ratio test, and absolute vs conditional convergence.</p></div>" }
    }
  }
};

for (const [unitNum, content] of Object.entries(unitContent)) {
  const file = path.join(DATA_DIR, `unit${unitNum}.json`);
  const existing = readJson(file);
  const merged = {
    ...existing,
    sections: content.sections,
    questionBank: content.questionBank,
    frqBank: content.frqBank,
    notesData: content.notesData
  };
  writeJson(file, merged);
}

console.log("Generated starter content for Units 1-5, 9, and 10.");

