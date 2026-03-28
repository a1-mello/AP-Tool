(() => {
  const unitConfig = {};

  const store = {
    activeUnitKey: "u6",
    activeUnitData: null,
    cache: {},
    unitsManifest: [],
    unitMcqCounts: {},
    mergedAllQuestionBank: [],
    initDone: false
  };
  window.unitStore = store;

  function getInlineQuestionBank() {
    return Array.isArray(questionBank) ? questionBank : [];
  }
  function getInlineFrqBank() {
    return Array.isArray(frqBank) ? frqBank : [];
  }
  function getInlineNotesData() {
    return notesData || {};
  }

  function getActiveQuestionBank() {
    if (store.activeUnitKey === "all" && Array.isArray(store.mergedAllQuestionBank)) {
      return store.mergedAllQuestionBank;
    }
    if (store.activeUnitData && Array.isArray(store.activeUnitData.questionBank)) {
      return store.activeUnitData.questionBank;
    }
    return getInlineQuestionBank();
  }

  function getActiveFrqBank() {
    if (store.activeUnitData && Array.isArray(store.activeUnitData.frqBank)) {
      return store.activeUnitData.frqBank;
    }
    return getInlineFrqBank();
  }

  function getActiveNotesData() {
    if (store.activeUnitData && store.activeUnitData.notesData && typeof store.activeUnitData.notesData === "object") {
      return store.activeUnitData.notesData;
    }
    return getInlineNotesData();
  }

  function resolveUnitJsonUrl(unitKey) {
    const fileNum = unitKey.replace("u", "");
    const rel = `data/unit${fileNum}.json`;
    try {
      return new URL(rel, window.location.href).href;
    } catch {
      return rel;
    }
  }

  async function loadUnitFile(unitKey) {
    if (Object.prototype.hasOwnProperty.call(store.cache, unitKey)) {
      return store.cache[unitKey];
    }
    const url = resolveUnitJsonUrl(unitKey);
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      store.cache[unitKey] = data;
      return data;
    } catch (err) {
      store.cache[unitKey] = null;
      return null;
    }
  }

  async function loadUnitsManifest() {
    try {
      const url = new URL("data/units.json", window.location.href).href;
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      store.unitsManifest = Array.isArray(j.units) ? j.units : [];
    } catch {
      store.unitsManifest = [];
    }
  }

  function usableMcqs(data) {
    const qb = Array.isArray(data?.questionBank) ? data.questionBank : [];
    return qb.filter(q => q && !q.packetAuto);
  }

  async function initUnitRegistry() {
    await loadUnitsManifest();
    store.mergedAllQuestionBank = [];
    store.unitMcqCounts = {};

    for (const u of store.unitsManifest) {
      const key = u.id;
      if (!/^u\d+$/.test(key)) continue;
      const data = await loadUnitFile(key);
      const list = usableMcqs(data);
      store.unitMcqCounts[key] = list.length;
      for (const q of list) {
        store.mergedAllQuestionBank.push(q);
      }
      const sections =
        data?.sections?.length > 0
          ? [...data.sections]
          : [...new Set(list.map(x => x.section).filter(Boolean))].sort();
      unitConfig[key] = {
        id: key,
        label: u.label || key,
        file: u.file || `data/unit${key.replace("u", "")}.json`,
        sections
      };
    }
    store.initDone = true;
  }

  function buildUnitPickerButtons() {
    const host = document.getElementById("unit-picker-units");
    if (!host) return;
    let html = "";
    if (store.mergedAllQuestionBank.length > 0) {
      html += `<button type="button" onclick="quickSelect('all')" class="unit-quick-btn" id="qb-all">All</button>`;
    }
    for (const u of store.unitsManifest) {
      const id = u.id;
      if (!/^u\d+$/.test(id)) continue;
      const cnt = store.unitMcqCounts[id] ?? 0;
      const label = escapeHtml(u.label || id);
      if (cnt > 0) {
        html += `<button type="button" onclick="quickSelect('${escapeHtml(id)}')" class="unit-quick-btn" id="qb-${escapeHtml(id)}">${label}</button>`;
      } else {
        html += `<span class="unit-soon">${label} <span class="unit-soon-tag">(coming soon)</span></span>`;
      }
    }
    host.innerHTML = html || `<span style="font-size:11px;color:var(--text3)">No units listed in data/units.json.</span>`;
  }

  function rebuildSectionFilterUis() {
    const qb = getActiveQuestionBank();
    const fromBank = [...new Set(qb.map(q => q.section).filter(Boolean))].sort();
    let sections = fromBank;
    if (store.activeUnitKey !== "all" && store.activeUnitData?.sections?.length > 0) {
      const allowed = new Set(store.activeUnitData.sections);
      sections = fromBank.filter(s => allowed.has(s));
      if (sections.length === 0) sections = [...store.activeUnitData.sections].sort();
    }

    const sidebarHost = document.getElementById("unit-picker-sections");
    if (sidebarHost) {
      if (sections.length === 0) {
        sidebarHost.innerHTML = `<div style="font-size:11px;color:var(--text3);padding:6px">No sections in this unit yet.</div>`;
      } else {
        sidebarHost.innerHTML = sections
          .map(
            sec =>
              `<label class="unit-cb-label"><input type="checkbox" class="sec-cb" value="${escapeHtml(sec)}" onchange="handleSectionCB()"> ${escapeHtml(sec)}</label>`
          )
          .join("");
      }
    }

    const menuHost = document.getElementById("section-menu-checks");
    if (menuHost) {
      if (sections.length === 0) {
        menuHost.innerHTML = `<div style="font-size:11px;color:var(--text3);padding:6px 8px">No sections</div>`;
      } else {
        menuHost.innerHTML = sections
          .map(
            sec =>
              `<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--text2);font-family:var(--font)" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''"><input type="checkbox" class="sec-cb" value="${escapeHtml(sec)}" onchange="handleSectionCB()" style="accent-color:#1a56db"> ${escapeHtml(sec)}</label>`
          )
          .join("");
      }
    }
    const ml = document.getElementById("section-menu-label");
    if (ml) {
      ml.textContent =
        selectedSections[0] === "all" || selectedSections.length === 0
          ? "All Sections"
          : selectedSections.length === 1
            ? selectedSections[0]
            : `${selectedSections.length} sections`;
    }
    if (typeof syncSectionCheckboxesAcrossUis === "function") syncSectionCheckboxesAcrossUis();
  }

  function updateTopbarSubtitle(pageId) {
    const sub = document.getElementById("topbar-sub");
    if (!sub) return;
    const unitLabel = unitConfig[store.activeUnitKey]?.label || "Unit";
    const map = {
      "practice-mc": `${unitLabel} · Multiple Choice`,
      "practice-frq": `${unitLabel} · Free Response`,
      "notes": `${unitLabel} · Notes`,
      flashcards: (() => {
        const u = unitConfig[store.activeUnitKey]?.label || "Unit";
        const hasUnit = store.activeUnitData && Array.isArray(store.activeUnitData.flashcards) && store.activeUnitData.flashcards.length > 0;
        return hasUnit ? `${u} · Flashcards` : "Global · Formulas and Theorems";
      })(),
      "flagged": "Flagged Topics",
      reference: `${unitLabel} · Reference`,
    };
    if (map[pageId]) sub.textContent = map[pageId];
  }

  function updateTopbarTitle(pageId) {
    const title = document.getElementById("topbar-title");
    if (!title) return;
    const map = {
      "practice-mc": "Multiple Choice Practice",
      "practice-frq": "Free Response Practice",
      "notes": "Lesson Notes",
      "flashcards": "Flashcards",
      "reference": "Reference Sheet",
      "flagged": "Flagged Topics"
    };
    if (map[pageId]) title.textContent = map[pageId];
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderNotesFallbackFromMaterials() {
    const container = document.getElementById("notes-container");
    if (!container) return;
    container.innerHTML = `
        <div class="notes-section">
          <h2>No notes for this section</h2>
          <p style="color:var(--text2)">Add a <code style="font-family:var(--mono)">notesData</code> entry in <code style="font-family:var(--mono)">data/${store.activeUnitKey.replace("u", "unit")}.json</code> for this unit.</p>
        </div>`;
  }

  function renderNotesTabs() {
    const bar = document.getElementById("notes-tab-bar");
    if (!bar) return;
    const notes = getActiveNotesData();
    const sections = Object.keys(notes);
    if (sections.length === 0) {
      bar.innerHTML = `<div style="font-size:11px;color:var(--text3);padding:2px 6px">No structured notes sections in this unit yet.</div>`;
      return;
    }
    const unitLabel =
      store.activeUnitKey === "all" ? "All units" : unitConfig[store.activeUnitKey]?.label || "Unit";
    bar.innerHTML = `<div style="display:flex;gap:2px;align-items:center;padding:2px 6px;font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em">${escapeHtml(unitLabel)}</div>` +
      sections.map((s, i) => `<button class="tab-btn ${i === 0 ? "active" : ""}" onclick="showNotesSection('${s}')">${s}</button>`).join("");
  }

  function renderFRQTabs() {
    const bar = document.getElementById("frq-tab-bar");
    if (!bar) return;
    const bank = getActiveFrqBank();
    if (!bank || bank.length === 0) {
      bar.innerHTML = `<div style="font-size:11px;color:var(--text3);padding:2px 6px">No FRQs in this unit yet.</div>`;
      return;
    }
    bar.innerHTML = bank.map((frq, idx) =>
      `<button class="mode-tab ${idx === 0 ? "active" : ""}" onclick="showFRQ(${idx})" id="frq-tab-${idx}">${escapeHtml(frq.title || `FRQ ${idx + 1}`)}</button>`
    ).join("");
  }

  function syncAuxiliaryPages() {
    if (document.getElementById("page-notes")?.classList.contains("active")) {
      renderNotesTabs();
      const nk = Object.keys(getActiveNotesData());
      const first =
        selectedSections[0] && selectedSections[0] !== "all" && nk.includes(selectedSections[0])
          ? selectedSections[0]
          : nk[0];
      if (first) showNotesSection(first);
      else renderNotesFallbackFromMaterials();
    }
    if (document.getElementById("page-practice-frq")?.classList.contains("active")) {
      renderFRQTabs();
      showFRQ(0);
    }
    if (document.getElementById("page-reference")?.classList.contains("active")) {
      renderReferencePage();
    }
    if (document.getElementById("page-flashcards")?.classList.contains("active") && typeof buildDeck === "function") {
      buildDeck();
    }
  }

  window.quickSelect = async function quickSelectWithData(type) {
    if (!store.initDone) await initUnitRegistry();

    if (type === "all") {
      store.activeUnitKey = "all";
      store.activeUnitData = null;
      selectedSections = ["all"];
      const sa = document.getElementById("sec-all");
      if (sa) sa.checked = true;
      document.querySelectorAll(".unit-quick-btn").forEach(b => b.classList.remove("active"));
      document.getElementById("qb-all")?.classList.add("active");
      rebuildSectionFilterUis();
      if (typeof queuedQuestions !== "undefined" && Array.isArray(queuedQuestions)) queuedQuestions.length = 0;
      state.currentQuestion = null;
      loadQuestion();
      syncAuxiliaryPages();
      return;
    }

    if (unitConfig[type]) {
      store.activeUnitKey = type;
      const cfg = unitConfig[type];
      const loaded = await loadUnitFile(type);
      store.activeUnitData =
        loaded ||
        {
          unit: cfg.label,
          sections: cfg.sections || [],
          questionBank: [],
          frqBank: [],
          notesData: {}
        };

      let nextSections = [];
      if (store.activeUnitData.sections?.length > 0) {
        nextSections = [...store.activeUnitData.sections];
      } else if (cfg.sections?.length > 0) {
        nextSections = [...cfg.sections];
      } else if (Array.isArray(store.activeUnitData.questionBank) && store.activeUnitData.questionBank.length > 0) {
        nextSections = [...new Set(usableMcqs(store.activeUnitData).map(q => q.section).filter(Boolean))].sort();
      }
      selectedSections = nextSections.length > 0 ? [...nextSections] : ["all"];

      document.querySelectorAll(".unit-quick-btn").forEach(b => b.classList.remove("active"));
      document.getElementById(`qb-${type}`)?.classList.add("active");
      const sa = document.getElementById("sec-all");
      if (sa) sa.checked = selectedSections[0] === "all";
      rebuildSectionFilterUis();
      if (typeof queuedQuestions !== "undefined" && Array.isArray(queuedQuestions)) queuedQuestions.length = 0;
      state.currentQuestion = null;
      loadQuestion();
      syncAuxiliaryPages();
    }
  };

  function renderReferencePage() {
    const inner = document.getElementById("reference-sheet-inner");
    const heading = document.getElementById("reference-page-heading");
    const blurb = document.getElementById("reference-page-blurb");
    if (!inner) return;
    if (!store._defaultReferenceInnerHtml) {
      store._defaultReferenceInnerHtml = inner.innerHTML;
    }
    const unitLabel =
      store.activeUnitKey === "all" ? "All units" : unitConfig[store.activeUnitKey]?.label || "AP Calc AB";
    if (heading) {
      heading.textContent = store.activeUnitData?.referenceTitle || "AP Calc AB — Reference Sheet";
    }
    if (blurb) {
      blurb.textContent = store.activeUnitData?.referenceBlurb || "Everything you need to memorize for the exam, plus unit-specific links below.";
    }
    const extra = store.activeUnitData && typeof store.activeUnitData.referenceHtml === "string" && store.activeUnitData.referenceHtml.trim();
    if (extra) {
      inner.innerHTML = `<div class="notes-block" style="margin-bottom:20px;grid-column:1 / -1">${store.activeUnitData.referenceHtml}</div>${store._defaultReferenceInnerHtml}`;
    } else {
      inner.innerHTML = store._defaultReferenceInnerHtml;
    }
    if (window.MathJax) MathJax.typesetPromise();
  }

  window.loadQuestion = function loadQuestionUsingActiveUnit() {
    clearInterval(state.timerInterval);
    state.answeredCurrentQuestion = false;
    highlightMode = false;
    eliminateMode = false;
    const ht = document.getElementById("highlight-tool");
    const et = document.getElementById("elim-tool");
    if (ht) ht.classList.remove("active");
    if (et) et.classList.remove("active");

    const qb = getActiveQuestionBank();
    const allSections = [...new Set(qb.map(q => q.section).filter(Boolean))];
    const pool = (selectedSections[0] === "all" || selectedSections.length === 0) ? allSections : selectedSections;
    const filtered = qb.filter(q => pool.includes(q.section) && !q.packetAuto);
    if (filtered.length === 0) {
      const loading = document.getElementById("loading-q");
      const content = document.getElementById("question-content");
      if (loading && content) {
        loading.style.display = "block";
        content.style.display = "none";
        loading.innerHTML = `<div class="loading-text">No questions available for this unit yet.</div>`;
      }
      return;
    }

    if (queuedQuestions.length === 0) {
      queuedQuestions = [...filtered].sort(() => Math.random() - 0.5);
    }
    const q = queuedQuestions.pop();
    state.currentQuestion = q;
    renderQuestion(q);
  };

  window.showNotesSection = function showNotesSectionUsingActiveUnit(section) {
    document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
    if (window.event && window.event.target) window.event.target.classList.add("active");

    const currentNotes = getActiveNotesData();
    const data = currentNotes[section];
    if (!data) {
      renderNotesFallbackFromMaterials();
      return;
    }
    const ul = store.activeUnitKey === "all" ? "All units" : unitConfig[store.activeUnitKey]?.label || "Unit";
    document.getElementById("notes-container").innerHTML = `
      <div class="notes-section">
        <div class="subunit-tag">${escapeHtml(ul)} · Section ${escapeHtml(section)}</div>
        <h2>${data.title}</h2>
        ${rewriteLocalMaterialHrefs(data.content)}
      </div>`;
    const secEl = document.querySelector("#notes-container .notes-section");
    if (secEl && typeof window.formatMathInElement === "function") window.formatMathInElement(secEl);
    if (window.MathJax) MathJax.typesetPromise();
  };

  /** Directory of the current HTML file (trailing slash), for resolving relative PDF paths. */
  function documentBaseHref() {
    try {
      let base = String(window.location.href);
      const cut = Math.min(
        base.indexOf("?") >= 0 ? base.indexOf("?") : Infinity,
        base.indexOf("#") >= 0 ? base.indexOf("#") : Infinity
      );
      if (cut !== Infinity) base = base.slice(0, cut);
      const slash = base.lastIndexOf("/");
      return slash >= 0 ? base.slice(0, slash + 1) : base + "/";
    } catch {
      return "/";
    }
  }

  /** Worksheet / answer PDFs live under <site>/materials/… (mirror your Unit folders there). */
  function frqPdfUrl(relPath) {
    if (!relPath || typeof relPath !== "string") return "";
    let p = String(relPath).trim().replace(/&amp;/g, "&");
    if (/^https?:\/\//i.test(p)) {
      return encodeURI(p.replace(/#/g, "%23"));
    }
    if (!p.startsWith("materials/")) {
      p = `materials/${p}`;
    }
    const segments = p.split("/").map(seg => {
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    });
    const joined = segments.join("/");
    try {
      return new URL(joined, documentBaseHref()).href;
    } catch {
      return encodeURI(joined.replace(/#/g, "%23"));
    }
  }

  const PDFJS_VER = "4.4.168";
  const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VER}/build/`;

  let pdfJsImportPromise = null;
  function loadPdfJsLib() {
    if (!pdfJsImportPromise) {
      pdfJsImportPromise = import(/* webpackIgnore: true */ PDFJS_BASE + "pdf.min.mjs").then(mod => {
        const lib = mod.default && typeof mod.getDocument !== "function" ? mod.default : mod;
        if (lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + "pdf.worker.min.mjs";
        return lib;
      });
    }
    return pdfJsImportPromise;
  }

  async function renderPdfIntoHost(hostEl, url, pdfjsLib) {
    if (!hostEl || !url) return;
    hostEl.innerHTML = '<div class="frq-pdf-loading">Loading PDF…</div>';
    const fail = (msg, useIframe) => {
      const esc = escapeHtml(url);
      hostEl.innerHTML = `<div class="frq-pdf-error"><p>${escapeHtml(msg)}</p>${
        useIframe ? `<iframe class="frq-pdf-frame frq-pdf-fallback-iframe" title="PDF" src="${esc}"></iframe>` : ""
      }</div>`;
    };
    try {
      const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
      const pdf = await loadingTask.promise;
      hostEl.innerHTML = "";
      const pagesWrap = document.createElement("div");
      pagesWrap.className = "frq-pdf-pages";
      hostEl.appendChild(pagesWrap);

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 60));
      const split = hostEl.closest(".frq-split-layout");
      const splitW = split ? split.getBoundingClientRect().width : 640;
      const isKeyPane = String(hostEl.id || "").includes("-key");
      const guessW = isKeyPane ? splitW * 0.36 : splitW * 0.58;
      let hostW = hostEl.getBoundingClientRect().width;
      if (hostW < 48) hostW = guessW;
      hostW = Math.max(280, hostW - 12);

      for (let pi = 1; pi <= pdf.numPages; pi++) {
        const page = await pdf.getPage(pi);
        const baseVp = page.getViewport({ scale: 1 });
        const scale = Math.min(2, hostW / baseVp.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "frq-pdf-page-canvas";
        await page.render({ canvasContext: ctx, viewport }).promise;
        pagesWrap.appendChild(canvas);
      }
    } catch (e) {
      console.warn("PDF.js:", e);
      fail(
        "Could not show this PDF here. Put the file under materials/, open the site with a local server (not file://), and check the path.",
        true
      );
    }
  }

  async function renderFrqPdfHosts(frqIdx, worksheetUrl, answerKeyUrl) {
    let pdfjsLib = null;
    try {
      pdfjsLib = await loadPdfJsLib();
    } catch (e) {
      console.warn("pdf.js load failed", e);
    }

    const renderOne = async (hostId, pdfUrl) => {
      const el = document.getElementById(hostId);
      if (!el || !pdfUrl) return;
      if (pdfjsLib && typeof pdfjsLib.getDocument === "function") {
        await renderPdfIntoHost(el, pdfUrl, pdfjsLib);
      } else {
        el.innerHTML = `<iframe class="frq-pdf-frame" style="width:100%;min-height:480px;border:0;flex:1" title="PDF" src="${escapeHtml(
          pdfUrl
        )}"></iframe>`;
      }
    };

    await Promise.all([
      renderOne(`frq-pdf-host-${frqIdx}-worksheet`, worksheetUrl),
      renderOne(`frq-pdf-host-${frqIdx}-key`, answerKeyUrl)
    ]);
  }

  function frqPdfPaneMarkup(url, paneLabel, hostId) {
    if (!url) return "";
    const lab = escapeHtml(paneLabel || "PDF");
    const id = escapeHtml(hostId);
    return `<div class="frq-pdf-pane">
      <div class="frq-pdf-label">${lab}</div>
      <div class="frq-pdf-js-host" id="${id}">
        <div class="frq-pdf-loading">Loading PDF…</div>
      </div>
    </div>`;
  }

  function rewriteLocalMaterialHrefs(html) {
    if (!html || typeof html !== "string") return html;
    return html.replace(/\bhref=(["'])(?!https?:|mailto:|#|javascript:|data:|materials\/)([^"']+)\1/gi, (m, q, path) => {
      let p = String(path).replace(/&amp;/g, "&");
      return `href=${q}materials/${p}${q}`;
    });
  }

  /** PDF extractors often map math letters to Hangul BMP codepoints — hide that garbage when a worksheet PDF exists. */
  function frqQuestionPlainText(html) {
    return String(html || "").replace(/<[^>]+>/g, " ");
  }

  function frqPartQuestionHtml(frq, part) {
    const raw = part.question || "";
    const plain = frqQuestionPlainText(raw);
    if (frq.worksheetPdf && /[\uAC00-\uD7AF]/.test(plain)) {
      const lab = escapeHtml(String(part.label || "?"));
      return `<p class="frq-pdf-ref" style="font-size:14px;line-height:1.55;color:var(--text2)">Do part <strong>${lab}</strong> on the <strong>worksheet PDF</strong> (left). Auto-extracted text was garbled, so use the PDF for every formula, table, and graph.</p>`;
    }
    return raw;
  }

  function frqFinalAnswerDisplay(part, hasKeyPdf) {
    const fa = String(part.finalAnswer || "");
    if (/Use the answer key PDF in Materials|open the matching ANSWERS/i.test(fa)) {
      return hasKeyPdf
        ? "<p style=\"margin:0\">Use the <strong>Answer key</strong> panel on the right on this page.</p>"
        : "<p style=\"margin:0\">Check the embedded answer materials for this worksheet when available.</p>";
    }
    if (/See answer key PDF linked from Materials/i.test(fa)) {
      return "<p style=\"margin:0\">Use the <strong>Answer key</strong> panel on the right when available.</p>";
    }
    return fa;
  }

  function frqStepsDisplay(part, hasKeyPdf) {
    const steps = Array.isArray(part.steps) ? part.steps : [];
    const out = steps.map(s => {
      const t = String(s);
      if (/Work the problem fully on paper|Confirm with the scanned key PDF/i.test(t)) {
        return hasKeyPdf
          ? "Toggle the <strong>Answer key</strong> PDF on the right and compare your work."
          : "Verify your reasoning against your notes or the answer key when provided.";
      }
      return t;
    });
    return [...new Set(out)];
  }

  function buildFrqPartAnswerHtml(idx, part, i, frq) {
    const hasKey = Boolean(frq && frq.answerKeyPdf);
    const fa = frqFinalAnswerDisplay(part, hasKey);
    const steps = frqStepsDisplay(part, hasKey);
    return `<div id="frq-answer-${idx}-${i}" style="display:none;margin-top:14px">
          <div style="background:var(--green-bg);border:1px solid #bbf7d0;border-radius:var(--radius);padding:14px 16px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--green);margin-bottom:8px;font-family:var(--font)">Model Answer</div>
            <div style="font-size:14px;color:var(--text);font-weight:600;font-family:'Times New Roman',Georgia,serif;margin-bottom:10px">${fa}</div>
          </div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--accent);margin-bottom:8px;font-family:var(--font)">Step-by-Step Work</div>
            ${steps.map((s, si) => `<div style="display:flex;gap:10px;margin-bottom:7px;font-size:13px;font-family:'Times New Roman',Georgia,serif;color:var(--text2)"><span style="font-family:var(--font);color:var(--text3);min-width:18px;font-size:11px;padding-top:2px">${si + 1}.</span><span>${s}</span></div>`).join("")}
          </div>
          <div style="background:var(--amber-bg);border:1px solid #fcd34d;border-radius:var(--radius);padding:10px 14px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--amber);margin-bottom:4px;font-family:var(--font)">Scoring</div>
            <div style="font-size:12px;color:var(--text2);font-family:var(--font)">${part.scoring || ""}</div>
          </div>
        </div>`;
  }

  window.toggleFrqKeyPanel = function toggleFrqKeyPanel(idx) {
    const aside = document.getElementById(`frq-key-aside-${idx}`);
    if (!aside) return;
    aside.classList.toggle("frq-key-collapsed");
    const btn = aside.querySelector(".frq-key-tabbtn");
    if (btn) btn.textContent = aside.classList.contains("frq-key-collapsed") ? "Show answer key" : "Hide answer key";
  };

  window.showFRQ = function showFRQUsingActiveUnit(idx) {
    document.querySelectorAll('[id^="frq-tab-"]').forEach(t => t.classList.remove("active"));
    const tab = document.getElementById("frq-tab-" + idx);
    if (tab) tab.classList.add("active");

    const bank = getActiveFrqBank();
    const frq = bank[idx];
    if (!frq) {
      document.getElementById("frq-display").innerHTML = `<div class="frq-empty">No FRQ set found for this unit yet.</div>`;
      return;
    }

    const parts = Array.isArray(frq.parts) ? frq.parts : [];
    const partsHtml = parts
      .map((part, i) => {
        return `<div class="frq-part" style="border-top:1px solid var(--border);padding-top:14px;margin-top:10px">
        <div class="frq-part-label">${escapeHtml(part.label)} &nbsp;<span style="color:var(--text3);font-weight:400">(${escapeHtml(String(part.points))} points)</span></div>
        <div class="frq-part-q">${frqPartQuestionHtml(frq, part)}</div>
        ${buildFrqPartAnswerHtml(idx, part, i, frq)}
        <button type="button" onclick="toggleFRQAnswer(${idx},${i},this)" style="margin-top:12px;padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)">Show Answer & Scoring</button>
      </div>`;
      })
      .join("");

    if (frq.worksheetPdf) {
      const ws = frqPdfUrl(frq.worksheetPdf);
      const ak = frq.answerKeyPdf ? frqPdfUrl(frq.answerKeyPdf) : "";
      const wsTitleRaw = frq.title || "Worksheet";
      const wsTitleHtml = escapeHtml(wsTitleRaw);
      const keyBlock = ak
        ? frqPdfPaneMarkup(ak, "Answer key", `frq-pdf-host-${idx}-key`)
        : `<div class="frq-key-fallback-notes"><p style="font-size:12px;color:var(--text3);margin-bottom:10px">No separate answer PDF linked — expand each part below for model solutions.</p>${partsHtml}</div>`;

      const html = `<div class="frq-card frq-card-embed">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <span class="badge ${frq.calcAllowed ? "badge-calc-c" : "badge-calc-nc"}">${frq.calcAllowed ? "Calculator Active" : "No Calculator"}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);font-family:var(--font)">${wsTitleHtml}</span>
      </div>
      <div class="frq-prompt">${frq.context || ""}</div>
      <div class="frq-split-layout">
        ${frqPdfPaneMarkup(ws, "Worksheet", `frq-pdf-host-${idx}-worksheet`)}
        <aside class="frq-key-panel" id="frq-key-aside-${idx}">
          <button type="button" class="frq-key-tabbtn" onclick="toggleFrqKeyPanel(${idx})">Hide answer key</button>
          <div class="frq-key-panel-inner" id="frq-key-inner-${idx}">
            ${keyBlock}
          </div>
        </aside>
      </div>
      ${ak ? `<div class="frq-parts-below">${partsHtml}</div>` : ""}
    </div>`;

      document.getElementById("frq-display").innerHTML = html;
      if (window.MathJax) MathJax.typesetPromise();
      renderFrqPdfHosts(idx, ws, ak).catch(err => console.warn("FRQ PDF render:", err));
      return;
    }

    let html = `<div class="frq-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span class="badge ${frq.calcAllowed ? "badge-calc-c" : "badge-calc-nc"}">${frq.calcAllowed ? "Calculator Active" : "No Calculator"}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);font-family:var(--font)">${escapeHtml(frq.title || "")}</span>
      </div>
      <div class="frq-prompt">${frq.context || ""}</div>
      <div class="frq-parts">${partsHtml}</div></div>`;
    document.getElementById("frq-display").innerHTML = html;
    if (window.MathJax) MathJax.typesetPromise();
  };

  const originalShowPage = window.showPage;
  window.showPage = function showPageWithUnitSubtitle(id) {
    originalShowPage(id);
    updateTopbarTitle(id);
    updateTopbarSubtitle(id);
    if (id === "practice-mc" && store.initDone) rebuildSectionFilterUis();
    if (id === "notes") {
      renderNotesTabs();
      const notesKeys = Object.keys(getActiveNotesData());
      const first =
        (selectedSections[0] && selectedSections[0] !== "all" && notesKeys.includes(selectedSections[0])
          ? selectedSections[0]
          : null) || notesKeys[0];
      if (first) showNotesSection(first);
      else renderNotesFallbackFromMaterials();
    }
    if (id === "practice-frq") {
      renderFRQTabs();
      showFRQ(0);
    }
    if (id === "reference") renderReferencePage();
    if (id === "flashcards" && typeof buildDeck === "function") buildDeck();
  };

  const _buildDeck = window.buildDeck;
  if (typeof _buildDeck === "function") {
    window.buildDeck = function buildDeckWithUnitFlashcards() {
      const unitCards =
        store.activeUnitData && Array.isArray(store.activeUnitData.flashcards) && store.activeUnitData.flashcards.length > 0
          ? store.activeUnitData.flashcards
          : null;
      const base = unitCards || (typeof flashcards !== "undefined" ? flashcards : []);
      fcFiltered = fcCurrentFilter === "all" ? [...base] : base.filter(f => f.tag === fcCurrentFilter);
      if (fcFiltered.length === 0 && fcCurrentFilter !== "all") {
        fcFiltered = [...base];
        fcCurrentFilter = "all";
        document.querySelectorAll('[id^="fc-chip-"]').forEach(c => c.classList.remove("active"));
        document.getElementById("fc-chip-all")?.classList.add("active");
      }
      fcDeck = [...fcFiltered];
      fcIndex = 0;
      fcKnown = new Set();
      fcFlipped = false;
      document.getElementById("fc-deck-view").style.display = "block";
      document.getElementById("fc-complete").style.display = "none";
      if (typeof renderFCCard === "function") renderFCCard();
    };
  }

  window.bootstrapStudyApp = async function bootstrapStudyApp() {
    await initUnitRegistry();
    buildUnitPickerButtons();
    const firstWithMcq = store.unitsManifest.find(u => /^u\d+$/.test(u.id) && (store.unitMcqCounts[u.id] ?? 0) > 0);
    const pick = firstWithMcq?.id || (store.mergedAllQuestionBank.length > 0 ? "all" : null);
    if (pick) {
      await window.quickSelect(pick);
    } else {
      const loading = document.getElementById("loading-q");
      const content = document.getElementById("question-content");
      if (loading && content) {
        loading.style.display = "block";
        content.style.display = "none";
        loading.innerHTML = `<div class="loading-text">No questions available for this unit yet.</div>`;
      }
    }
    renderNotesTabs();
    const nk = Object.keys(getActiveNotesData());
    if (nk.length) showNotesSection(nk[0]);
    else renderNotesFallbackFromMaterials();
    if (typeof buildDeck === "function") buildDeck();
    renderFRQTabs();
    if (typeof showFRQ === "function") showFRQ(0);
    updateTopbarTitle("practice-mc");
    updateTopbarSubtitle("practice-mc");
  };

  updateTopbarSubtitle("practice-mc");
})();
