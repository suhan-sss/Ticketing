/**
 * Toast notification system. Stackable, auto-dismiss after 3s.
 * Usage: Toast.success("Saved"); Toast.error("Failed"); Toast.warning("Heads up");
 */
const Toast = (() => {
  let host;

  function ensureHost() {
    if (host) return host;
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(host);
    return host;
  }

  function show(message, type = "success") {
    const root = ensureHost();
    const styles = {
      success: { bg: "bg-emerald-600", icon: "check" },
      error:   { bg: "bg-rose-600",    icon: "warning" },
      warning: { bg: "bg-amber-500",   icon: "warning" },
      info:    { bg: "bg-sky-600",     icon: "bell" },
    };
    const s = styles[type] || styles.info;

    const el = document.createElement("div");
    el.className = `${s.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[260px] max-w-sm pointer-events-auto animate-fade-in`;
    el.innerHTML = `
      <span class="shrink-0 w-5 h-5">
        ${s.icon === "check"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
        }
      </span>
      <span class="text-sm font-medium flex-1">${Utils.escapeHtml(message)}</span>
      <button class="opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  return {
    success: (m) => show(m, "success"),
    error:   (m) => show(m, "error"),
    warning: (m) => show(m, "warning"),
    info:    (m) => show(m, "info"),
  };
})();