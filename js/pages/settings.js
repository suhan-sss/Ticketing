/**
 * Automation rules page — list, toggle, create modal with condition/action builders.
 */
(function () {
  let conditionApi, actionRows;

  function render() {
    document.getElementById("rules-host").innerHTML = Data.getRules().map(Templates.ruleCard).join("") ||
      `<div class="text-center text-sm text-slate-500 py-10">No rules yet. Create your first automation rule.</div>`;

    document.querySelectorAll("[data-rule-toggle]").forEach(el => {
      el.addEventListener("change", () => {
        Data.toggleRule(el.dataset.ruleToggle);
        Toast.success("Rule updated.");
        render();
      });
    });
    document.querySelectorAll("[data-rule-del]").forEach(el => {
      el.addEventListener("click", async () => {
        const ok = await Modal.confirm("Delete this rule? This cannot be undone.", { yesText: "Delete", tone: "rose" });
        if (!ok) return;
        Data.deleteRule(el.dataset.ruleDel);
        Toast.success("Rule deleted.");
        render();
      });
    });
  }

  function openNewRule() {
    document.getElementById("rule-name").value = "";
    document.getElementById("rule-desc").value = "";
    document.getElementById("new-rule-modal").classList.remove("hidden");
    document.getElementById("new-rule-modal").classList.add("flex");

    conditionApi = ConditionBuilder.init("rule-conditions", [{ field: "priority", operator: "equals", value: "HIGH" }]);
    actionRows = [{ action: "assign", value: "" }];
    renderActions();
  }

  function renderActions() {
    const root = document.getElementById("rule-actions");
    root.innerHTML = actionRows.map((a, i) => `
      <div class="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <select data-ai="${i}" data-k="action" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          ${["assign","setStatus","setPriority","tag","notify"].map(o => `<option ${o===a.action?"selected":""}>${o}</option>`).join("")}
        </select>
        <input data-ai="${i}" data-k="value" type="text" value="${Utils.escapeHtml(a.value)}" placeholder="value (e.g. a3, RESOLVED, billing)" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm flex-1 min-w-[160px]">
        <button data-adel="${i}" class="text-slate-400 hover:text-rose-600" title="Remove">×</button>
      </div>`).join("");

    root.querySelectorAll("select,input").forEach(el => {
      el.addEventListener("input", () => {
        const i = +el.dataset.ai;
        actionRows[i][el.dataset.k] = el.value;
      });
    });
    root.querySelectorAll("button[data-adel]").forEach(b => {
      b.addEventListener("click", () => { actionRows.splice(+b.dataset.adel, 1); renderActions(); });
    });
  }

  function bindUI() {
    document.getElementById("btn-new-rule").addEventListener("click", openNewRule);
    document.getElementById("btn-add-action").addEventListener("click", () => { actionRows.push({ action: "assign", value: "" }); renderActions(); });
    document.querySelectorAll("[data-modal-close]").forEach(b => b.addEventListener("click", () => {
      document.getElementById("new-rule-modal").classList.add("hidden");
      document.getElementById("new-rule-modal").classList.remove("flex");
    }));
    document.getElementById("btn-save-rule").addEventListener("click", () => {
      const name = document.getElementById("rule-name").value.trim();
      if (!name) { Toast.error("Rule name is required."); return; }
      const when = conditionApi.get();
      const then = actionRows.filter(a => a.value.trim());
      if (!when.length || !then.length) { Toast.error("Add at least one condition and one action."); return; }
      Data.addRule({ id: Utils.generateId("r"), name, enabled: true, when, then });
      Toast.success("Rule created.");
      document.getElementById("new-rule-modal").classList.add("hidden");
      document.getElementById("new-rule-modal").classList.remove("flex");
      render();
    });
  }

  // ───────────────── AI Configuration tab ─────────────────
  const MODELS = {
    openai:    ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    anthropic: ["claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5"],
    gemini:    ["gemini-1.5-pro", "gemini-1.5-flash"],
    mock:      ["mock-fast", "mock-reasoning"],
  };

  function populateAIPanel() {
    const cfg = AI_CONFIG;
    document.getElementById("ai-provider").value = cfg.provider || "mock";
    populateModels();
    document.getElementById("ai-model").value = cfg.model || "mock-fast";
    document.getElementById("ai-key").value = "";
    document.getElementById("ai-key").placeholder = cfg.apiKey ? "•••••••• (saved)" : "sk-…";
    document.getElementById("ai-threshold").value = cfg.escalationThreshold ?? 0.7;
    document.getElementById("lbl-threshold").textContent = (+cfg.escalationThreshold ?? 0.7).toFixed(2);
    document.getElementById("ai-attempts").value = cfg.maxAttempts ?? 3;
    document.getElementById("ai-auto-classify").checked = cfg.autoClassify ?? true;
    document.getElementById("ai-suggest-reply").checked   = cfg.suggestReply ?? true;
    document.getElementById("ai-sentiment").checked      = cfg.detectSentiment ?? true;
    document.getElementById("ai-welcome").value = cfg.welcomeMessage || "";
    renderSuggestedQuestions(cfg.suggestedQuestions || []);
    renderKBFiles();
  }

  function populateModels() {
    const provider = document.getElementById("ai-provider").value;
    const sel = document.getElementById("ai-model");
    sel.innerHTML = (MODELS[provider] || []).map(m => `<option>${m}</option>`).join("");
  }

  function renderSuggestedQuestions(items) {
    const host = document.getElementById("ai-suggested");
    host.innerHTML = items.map((s, i) => `
      <div class="flex gap-2">
        <input data-sq="${i}" value="${Utils.escapeHtml(s)}" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
        <button data-sqdel="${i}" class="text-slate-400 hover:text-rose-600 px-2">×</button>
      </div>`).join("");
    host.querySelectorAll("[data-sqdel]").forEach(b => b.addEventListener("click", () => {
      items.splice(+b.dataset.sqdel, 1); renderSuggestedQuestions(items);
    }));
    host.querySelectorAll("[data-sq]").forEach(i => i.addEventListener("input", () => {
      items[+i.dataset.sq] = i.value;
    }));
  }

  function renderKBFiles() {
    const files = (RAG.getDocs?.() || []).map(d => ({ name: d.id, count: d.entries?.length || 1 }));
    document.getElementById("kb-files").innerHTML = files.map(f => `
      <li class="flex items-center justify-between gap-2 px-3 py-2 text-sm">
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          ${Utils.escapeHtml(f.name)} <span class="text-xs text-slate-500">(${f.count} entries)</span>
        </span>
        <span class="flex items-center gap-2 text-slate-500">
          <button class="text-xs hover:underline">Edit</button>
          <button class="text-xs hover:underline text-rose-600">Delete</button>
        </span>
      </li>`).join("");
  }

  function bindTabs() {
    document.querySelectorAll("[data-tab]").forEach(tab => {
      tab.addEventListener("click", () => {
        const t = tab.dataset.tab;
        document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("tab-active", x === tab));
        document.getElementById("panel-rules").classList.toggle("hidden", t !== "rules");
        document.getElementById("panel-ai").classList.toggle("hidden", t !== "ai");
        document.querySelectorAll("[data-tab-only]").forEach(el => {
          el.classList.toggle("hidden", el.dataset.tabOnly !== t);
        });
        if (t === "ai") populateAIPanel();
      });
    });
    document.getElementById("ai-provider")?.addEventListener("change", populateModels);
    document.getElementById("ai-threshold")?.addEventListener("input", (e) => {
      document.getElementById("lbl-threshold").textContent = (+e.target.value).toFixed(2);
    });
    document.getElementById("btn-add-suggestion")?.addEventListener("click", () => {
      const items = (AI_CONFIG.suggestedQuestions || []);
      items.push("New suggestion");
      renderSuggestedQuestions(items);
    });
    document.getElementById("btn-test-ai")?.addEventListener("click", async () => {
      const btn = document.getElementById("btn-test-ai");
      btn.disabled = true; btn.textContent = "Testing…";
      try {
        const r = await LLM.query("hello");
        Toast.success(`Connection OK (provider: ${AI_CONFIG.provider}, mock: ${!!r._mock})`);
      } catch (e) {
        Toast.error("Connection failed: " + e.message);
      } finally { btn.disabled = false; btn.textContent = "Test Connection"; }
    });
    document.getElementById("btn-save-ai")?.addEventListener("click", () => {
      AI_CONFIG.provider = document.getElementById("ai-provider").value;
      AI_CONFIG.model = document.getElementById("ai-model").value;
      const k = document.getElementById("ai-key").value.trim();
      if (k) AI_CONFIG.apiKey = k;
      AI_CONFIG.escalationThreshold = +document.getElementById("ai-threshold").value;
      AI_CONFIG.maxAttempts = +document.getElementById("ai-attempts").value;
      AI_CONFIG.autoClassify   = document.getElementById("ai-auto-classify").checked;
      AI_CONFIG.suggestReply   = document.getElementById("ai-suggest-reply").checked;
      AI_CONFIG.detectSentiment = document.getElementById("ai-sentiment").checked;
      AI_CONFIG.welcomeMessage = document.getElementById("ai-welcome").value;
      AI_CONFIG.suggestedQuestions = Array.from(document.querySelectorAll("[data-sq]"))
        .map(i => i.value.trim()).filter(Boolean).slice(0, 3);
      try { localStorage.setItem("AI_CONFIG", JSON.stringify(AI_CONFIG)); } catch (_) {}
      Toast.success("AI configuration saved.");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!Auth.requireAdmin()) return;
    Sidebar.render();
    bindUI();
    render();
    bindTabs();
  });
})();