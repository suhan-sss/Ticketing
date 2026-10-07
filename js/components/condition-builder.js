/**
 * Condition builder: dynamic rows of (field, operator, value, ×).
 */
const ConditionBuilder = {
  fields: [
    { v: "priority",  l: "Priority",   type: "select", options: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
    { v: "status",    l: "Status",     type: "select", options: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"] },
    { v: "channel",   l: "Channel",    type: "select", options: ["email", "chat", "phone", "webform"] },
    { v: "tag",       l: "Tag",        type: "select", options: ["billing", "bug", "feature", "onboarding", "urgent", "refund", "login", "mobile"] },
    { v: "subject",   l: "Subject contains", type: "text" },
    { v: "hoursOpen", l: "Hours open >", type: "number" },
  ],
  operators: [
    { v: "equals",   l: "equals"    },
    { v: "not",      l: "does not equal" },
    { v: "contains", l: "contains"  },
    { v: "greater",  l: "greater than" },
    { v: "less",     l: "less than" },
  ],

  init(containerId, initial = []) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const conditions = [...initial];

    const render = () => {
      root.innerHTML = `
        <div class="space-y-2" id="${containerId}-rows"></div>
        <button type="button" id="${containerId}-add" class="mt-3 text-sm text-brand-600 hover:underline">+ Add Condition</button>`;

      const rowsEl = document.getElementById(`${containerId}-rows`);
      rowsEl.innerHTML = conditions.map((c, i) => this._row(c, i)).join("");

      rowsEl.querySelectorAll("select,input").forEach(el => {
        el.addEventListener("input", () => {
          const i = +el.dataset.i;
          conditions[i] = {
            field:    rowsEl.querySelector(`[data-k="field"][data-i="${i}"]`).value,
            operator: rowsEl.querySelector(`[data-k="operator"][data-i="${i}"]`).value,
            value:    rowsEl.querySelector(`[data-k="value"][data-i="${i}"]`).value,
          };
        });
      });
      rowsEl.querySelectorAll("button[data-del]").forEach(b => {
        b.addEventListener("click", () => { conditions.splice(+b.dataset.del, 1); render(); });
      });
      document.getElementById(`${containerId}-add`).addEventListener("click", () => {
        conditions.push({ field: "priority", operator: "equals", value: "LOW" });
        render();
      });
    };

    render();
    return { get: () => conditions.filter(c => c.field && c.value !== "") };
  },

  _row(c, i) {
    const field = this.fields.find(f => f.v === c.field) || this.fields[0];
    const valueInput = field.type === "select"
      ? `<select data-k="value" data-i="${i}" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          ${field.options.map(o => `<option ${o === c.value ? "selected" : ""}>${o}</option>`).join("")}
        </select>`
      : `<input data-k="value" data-i="${i}" type="${field.type}" value="${Utils.escapeHtml(c.value)}" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">`;

    return `
      <div class="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <select data-k="field" data-i="${i}" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          ${this.fields.map(f => `<option value="${f.v}" ${f.v === c.field ? "selected" : ""}>${f.l}</option>`).join("")}
        </select>
        <select data-k="operator" data-i="${i}" class="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          ${this.operators.map(o => `<option value="${o.v}" ${o.v === c.operator ? "selected" : ""}>${o.l}</option>`).join("")}
        </select>
        ${valueInput}
        <button type="button" data-del="${i}" class="ml-auto text-slate-400 hover:text-rose-600" title="Remove">×</button>
      </div>`;
  },
};