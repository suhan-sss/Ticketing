/**
 * Global entry point — runs on every page (except login).
 * Handles auth check, dark mode toggle, mobile sidebar toggle.
 */
(function () {
  function applyTheme() {
    const t = localStorage.getItem(APP.storageKeys.theme);
    if (t === "dark") document.documentElement.classList.add("dark");
  }

  function bindGlobalUI() {
    // Dark mode
    document.getElementById("btn-theme")?.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem(APP.storageKeys.theme,
        document.documentElement.classList.contains("dark") ? "dark" : "light");
    });

    // Mobile sidebar toggle
    document.getElementById("btn-sidebar")?.addEventListener("click", () => {
      const sb = document.getElementById("sidebar");
      sb?.classList.toggle("-translate-x-full");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    bindGlobalUI();
  });
})();