(() => {
  const unitConfig = {
    u1: { id: "u1", label: "Unit 1", sections: [] },
    u2: { id: "u2", label: "Unit 2", sections: [] },
    u3: { id: "u3", label: "Unit 3", sections: [] },
    u4: { id: "u4", label: "Unit 4", sections: [] },
    u5: { id: "u5", label: "Unit 5", sections: [] },
    u6: { id: "u6", label: "Unit 6", sections: ["6.1", "6.2", "6.3", "6.4", "6.6", "6.7", "6.8", "6.9", "6.10"] },
    u7: { id: "u7", label: "Unit 7", sections: [] },
    u8: { id: "u8", label: "Unit 8", sections: ["8.1", "8.2", "8.3", "8.4", "8.7", "8.9", "8.11"] },
    u9: { id: "u9", label: "Unit 9", sections: [] },
    u10: { id: "u10", label: "Unit 10", sections: [] }
  };

  const store = {
    activeUnitKey: "u6",
    activeUnitData: null,
    cache: {}
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

  function getActiveMaterials() {
    if (store.activeUnitData && Array.isArray(store.activeUnitData.materials)) {
      return store.activeUnitData.materials;
    }
    return [];
  }

  async function loadUnitFile(unitKey) {
    if (store.cache[unitKey]) return store.cache[unitKey];
    const fileNum = unitKey.replace("u", "");
    const path = `data/unit${fileNum}.json`;
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      store.cache[unitKey] = data;
      return data;
    } catch (err) {
      return null;
    }
  }

  function updateTopbarSubtitle(pageId) {
    const sub = document.getElementById("topbar-sub");
    if (!sub) return;
    const unitLabel = unitConfig[store.activeUnitKey]?.label || "Unit";
    const map = {
      "practice-mc": `${unitLabel} · Multiple Choice`,
      "practice-frq": `${unitLabel} · Free Response`,
      "notes": `${unitLabel} · Notes`,
      "flashcards": "Global · Formulas and Theorems",
      "flagged": "Flagged Topics",
      "reference": `${unitLabel} · Reference`
      ,"materials": `${unitLabel} · PDFs`
    };
    if (map[pageId]) sub.textContent = map[pageId];
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderMaterials() {
    const container = document.getElementById("materials-container");
    if (!container) return;
    const mats = getActiveMaterials();
    if (!mats || mats.length === 0) {
      container.innerHTML = `<div class="flagged-empty">No PDFs added for this unit yet.<br>Add PDFs into the Unit folder in Finder, then run the materials builder.</div>`;
      return;
    }

    const byType = mats.reduce((acc, m) => {
      const k = m.type || "other";
      acc[k] = acc[k] || [];
      acc[k].push(m);
      return acc;
    }, {});

    const order = ["notes", "homework", "review", "other"];
    let html = `<div style="max-width:900px">`;
    html += `<h2 style="font-size:18px;margin-bottom:6px">Unit Materials (PDFs)</h2>`;
    html += `<p style="font-size:13px;color:var(--text3);margin-bottom:18px">Click a PDF to open it in a new tab.</p>`;

    for (const t of order) {
      const list = byType[t];
      if (!list || list.length === 0) continue;
      const label = t === "notes" ? "Notes" : t === "homework" ? "Homework" : t === "review" ? "Review" : "Other";
      html += `<div class="notes-block" style="margin-bottom:14px">`;
      html += `<h3 style="margin-bottom:10px">${label}</h3>`;
      html += `<div style="display:flex;flex-direction:column;gap:8px">`;
      for (const m of list) {
        html += `<a href="${escapeHtml(m.path)}" target="_blank" rel="noopener noreferrer" style="display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#fff;text-decoration:none;color:var(--text);box-shadow:var(--shadow)">
          <span style="font-weight:600;font-size:13px">${escapeHtml(m.title)}</span>
          <span style="font-size:12px;color:var(--text3)">Open ↗</span>
        </a>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
  }

  const originalQuickSelect = window.quickSelect;
  window.quickSelect = async function quickSelectWithData(type) {
    if (type === "all") {
      store.activeUnitKey = "u6";
      store.activeUnitData = null;
      if (typeof originalQuickSelect === "function") originalQuickSelect(type);
      return;
    }

    if (unitConfig[type]) {
      store.activeUnitKey = type;
      const loaded = await loadUnitFile(type);
      store.activeUnitData = loaded;

      const cfg = unitConfig[type];
      if (cfg.sections.length > 0) {
        selectedSections = [...cfg.sections];
      } else if (loaded && Array.isArray(loaded.sections) && loaded.sections.length > 0) {
        selectedSections = [...loaded.sections];
      }

      if (typeof originalQuickSelect === "function") originalQuickSelect(type);
      // Original quickSelect only marks active button for all/u6/u8.
      document.querySelectorAll(".unit-quick-btn").forEach(b => b.classList.remove("active"));
      const activeBtn = document.getElementById(`qb-${type}`);
      if (activeBtn) activeBtn.classList.add("active");
      state.currentQuestion = null;
      loadQuestion();
      if (document.getElementById("page-notes")?.classList.contains("active")) {
        const firstSection = selectedSections[0] || Object.keys(getActiveNotesData())[0];
        if (firstSection) showNotesSection(firstSection);
      }
      if (document.getElementById("page-practice-frq")?.classList.contains("active")) {
        showFRQ(0);
      }
      if (document.getElementById("page-materials")?.classList.contains("active")) {
        renderMaterials();
      }
      return;
    }

    if (typeof originalQuickSelect === "function") originalQuickSelect(type);
  };

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
    const filtered = qb.filter(q => pool.includes(q.section));
    if (filtered.length === 0) {
      const loading = document.getElementById("loading-q");
      const content = document.getElementById("question-content");
      if (loading && content) {
        loading.style.display = "block";
        content.style.display = "none";
        loading.innerHTML = `<div class="loading-text">No MCQ question bank found for ${unitConfig[store.activeUnitKey]?.label || "this unit"} yet.<br>Add questions to <code style="font-family:var(--mono)">data/${store.activeUnitKey.replace("u","unit")}.json</code>.</div>`;
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
      document.getElementById("notes-container").innerHTML = `
        <div class="notes-section">
          <h2>No notes for this section yet</h2>
          <p>Add notes under <code style="font-family:var(--mono)">notesData</code> in <code style="font-family:var(--mono)">data/${store.activeUnitKey.replace("u","unit")}.json</code>.</p>
        </div>`;
      return;
    }
    document.getElementById("notes-container").innerHTML = `
      <div class="notes-section">
        <div class="subunit-tag">${unitConfig[store.activeUnitKey]?.label || "Unit"} · Section ${section}</div>
        <h2>${data.title}</h2>
        ${data.content}
      </div>`;
    if (window.MathJax) MathJax.typesetPromise();
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
    let html = `<div class="frq-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span class="badge ${frq.calcAllowed ? "badge-calc-c" : "badge-calc-nc"}">${frq.calcAllowed ? "Calculator Active" : "No Calculator"}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);font-family:var(--font)">${frq.title}</span>
      </div>
      <div class="frq-prompt">${frq.context}</div>
      <div class="frq-parts">`;

    frq.parts.forEach((part, i) => {
      html += `<div class="frq-part" style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px">
        <div class="frq-part-label">${part.label} &nbsp;<span style="color:var(--text3);font-weight:400">(${part.points} points)</span></div>
        <div class="frq-part-q">${part.question}</div>
        <div id="frq-answer-${idx}-${i}" style="display:none;margin-top:14px">
          <div style="background:var(--green-bg);border:1px solid #bbf7d0;border-radius:var(--radius);padding:14px 16px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--green);margin-bottom:8px;font-family:var(--font)">Model Answer</div>
            <div style="font-size:14px;color:var(--text);font-weight:600;font-family:'Times New Roman',Georgia,serif;margin-bottom:10px">${part.finalAnswer}</div>
          </div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--accent);margin-bottom:8px;font-family:var(--font)">Step-by-Step Work</div>
            ${part.steps.map((s,si) => `<div style="display:flex;gap:10px;margin-bottom:7px;font-size:13px;font-family:'Times New Roman',Georgia,serif;color:var(--text2)"><span style="font-family:var(--font);color:var(--text3);min-width:18px;font-size:11px;padding-top:2px">${si + 1}.</span><span>${s}</span></div>`).join("")}
          </div>
          <div style="background:var(--amber-bg);border:1px solid #fcd34d;border-radius:var(--radius);padding:10px 14px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--amber);margin-bottom:4px;font-family:var(--font)">Scoring</div>
            <div style="font-size:12px;color:var(--text2);font-family:var(--font)">${part.scoring}</div>
          </div>
        </div>
        <button onclick="toggleFRQAnswer(${idx},${i},this)" style="margin-top:12px;padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)">Show Answer & Scoring</button>
      </div>`;
    });

    html += `</div></div>`;
    document.getElementById("frq-display").innerHTML = html;
    if (window.MathJax) MathJax.typesetPromise();
  };

  const originalShowPage = window.showPage;
  window.showPage = function showPageWithUnitSubtitle(id) {
    originalShowPage(id);
    updateTopbarSubtitle(id);
    if (id === "materials") renderMaterials();
  };

  updateTopbarSubtitle("practice-mc");
})();
