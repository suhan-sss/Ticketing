/**
 * Generic modal open/close + Promise-based confirm.
 */
const Modal = {
  open(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove("hidden");
    m.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    m.querySelector("[data-modal-close]")?.addEventListener("click", () => this.close(id), { once: true });
    m.addEventListener("click", (e) => { if (e.target === m) this.close(id); });
  },

  close(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("hidden");
    m.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  },

  /** Resolves true/false based on user choice. */
  confirm(message, opts = {}) {
    return new Promise((resolve) => {
      const id = "confirm-modal-" + Date.now();
      const yesText = opts.yesText || "Confirm";
      const noText  = opts.noText  || "Cancel";
      const tone    = opts.tone    || "brand";
      const host = document.createElement("div");
      host.innerHTML = `
        <div id="${id}" class="fixed inset-0 z-[9000] bg-slate-900/50 backdrop-blur-sm grid place-items-center px-4 animate-fade-in">
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <p class="text-slate-800 dark:text-slate-100 text-sm">${Utils.escapeHtml(message)}</p>
            <div class="mt-5 flex justify-end gap-2">
              <button data-act="no"  class="px-3 py-1.5 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">${noText}</button>
              <button data-act="yes" class="px-3 py-1.5 rounded-md text-sm font-medium bg-${tone}-600 text-white hover:bg-${tone}-700">${yesText}</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(host.firstElementChild);
      const m = document.getElementById(id);
      const finish = (v) => { m.remove(); document.body.classList.remove("overflow-hidden"); resolve(v); };
      m.querySelector('[data-act="yes"]').addEventListener("click", () => finish(true));
      m.querySelector('[data-act="no"]').addEventListener("click",  () => finish(false));
    });
  },
};