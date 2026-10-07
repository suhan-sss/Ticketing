/**
 * Tag chip input. Enter adds, Backspace on empty removes last, × removes.
 * Usage: TagInput.init('tag-host', { onChange: (tags) => ... })
 */
const TagInput = {
  init(containerId, opts = {}) {
    const root = document.getElementById(containerId);
    if (!root) return;
    root.innerHTML = `
      <div class="flex flex-wrap gap-1.5 items-center min-h-[40px] px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-brand-500">
        <div id="${containerId}-chips" class="flex flex-wrap gap-1.5"></div>
        <input id="${containerId}-input" type="text" placeholder="Type and press Enter..." class="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-slate-800 dark:text-slate-100 px-1 py-0.5">
      </div>
      <div id="${containerId}-suggest" class="flex flex-wrap gap-1 mt-2"></div>`;

    const chipsEl  = document.getElementById(`${containerId}-chips`);
    const inputEl = document.getElementById(`${containerId}-input`);
    const suggEl  = document.getElementById(`${containerId}-suggest`);
    const tags = new Set(opts.initial || []);

    function renderChips() {
      chipsEl.innerHTML = [...tags].map(t => {
        const tag = Data.getTag(t);
        const label = tag ? tag.label : t;
        const color = tag ? tag.color : "slate";
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-${color}-100 text-${color}-700">
          ${Utils.escapeHtml(label)}
          <button data-tag="${t}" class="opacity-60 hover:opacity-100" type="button">×</button>
        </span>`;
      }).join("");
      chipsEl.querySelectorAll("button[data-tag]").forEach(b => {
        b.addEventListener("click", () => { tags.delete(b.dataset.tag); renderChips(); suggest(); notify(); });
      });
    }

    function suggest() {
      const avail = Data.getTags().filter(t => !tags.has(t.id));
      suggEl.innerHTML = avail.map(t =>
        `<button type="button" data-tag="${t.id}" class="text-xs px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">+ ${Utils.escapeHtml(t.label)}</button>`
      ).join("");
      suggEl.querySelectorAll("button[data-tag]").forEach(b => {
        b.addEventListener("click", () => { tags.add(b.dataset.tag); renderChips(); suggest(); notify(); });
      });
    }

    function notify() { opts.onChange?.([...tags]); }

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = inputEl.value.trim().toLowerCase();
        if (v && !tags.has(v)) { tags.add(v); renderChips(); suggest(); notify(); }
        inputEl.value = "";
      } else if (e.key === "Backspace" && !inputEl.value && tags.size) {
        const last = [...tags].pop(); tags.delete(last); renderChips(); suggest(); notify();
      }
    });

    renderChips();
    suggest();

    return { getTags: () => [...tags] };
  },
};