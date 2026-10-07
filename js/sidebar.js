/**
 * Sidebar — renders nav, marks active item, exposes logout.
 * HTML host element: <aside id="sidebar"></aside>
 */
const Sidebar = {
  links: [
    { href: "index.html",    label: "Tickets",   icon: "ticket" },
    { href: "new.html",      label: "New Ticket",icon: "plus"    },
    { href: "settings.html", label: "Settings",  icon: "gear", adminOnly: true },
  ],

  render() {
    const host = document.getElementById("sidebar");
    if (!host) return;
    const user = Auth.user();
    const current = window.location.pathname.split("/").pop() || "index.html";

    const icon = (name) => {
      const paths = {
        ticket: '<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6M3 7a2 2 0 012-2h14a2 2 0 012 2"/>',
        plus:   '<path d="M12 4v16m8-8H4"/>',
        gear:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
        logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
      };
      return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</svg>`;
    };

    const items = this.links
      .filter(l => !l.adminOnly || (user && user.role === "admin"))
      .map(l => {
        const active = current === l.href;
        return `<a href="${l.href}" class="sidebar-link ${active ? "active" : ""}">
          ${icon(l.icon)}<span>${l.label}</span>
        </a>`;
      })
      .join("");

    host.innerHTML = `
      <div class="h-16 flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800">
        <div class="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">T</div>
        <span class="font-semibold text-slate-800 dark:text-slate-100">${APP.name}</span>
      </div>
      <nav class="flex-1 p-3 space-y-1">${items}</nav>
      <div class="p-3 border-t border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 px-2 py-2">
          <img src="assets/avatars/${user?.avatar || "default.svg"}" alt="" class="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${user?.name || "Guest"}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 capitalize">${user?.role || ""}</div>
          </div>
          <button id="btn-logout" title="Log out" class="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            ${icon("logout")}
          </button>
        </div>
      </div>`;

    document.getElementById("btn-logout")?.addEventListener("click", () => Auth.logout());
  },
};