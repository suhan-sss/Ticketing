/**
 * Auth — login/logout, session in localStorage, route guards.
 */
const Auth = {
  /** Returns user object or null */
  user() {
    const raw = localStorage.getItem(APP.storageKeys.user);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!localStorage.getItem(APP.storageKeys.token);
  },

  /** Redirect to login if not authenticated. */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  /** Admin-only guard (for settings page). */
  requireAdmin() {
    if (!this.requireAuth()) return false;
    const u = this.user();
    if (!u || u.role !== "admin") {
      Toast.warning("Admin access required.");
      window.location.href = "index.html";
      return false;
    }
    return true;
  },

  /** Demo login — any non-empty email/password accepted, role from select. */
  login(email, password, role) {
    if (!email || !password) {
      Toast.error("Email and password are required.");
      return false;
    }
    const fakeUser = {
      id:   "me",
      name: email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      email,
      role,
      avatar: "default.svg",
    };
    localStorage.setItem(APP.storageKeys.token, "demo-token-" + Date.now());
    localStorage.setItem(APP.storageKeys.user, JSON.stringify(fakeUser));
    Toast.success(`Welcome back, ${fakeUser.name}!`);
    window.location.href = "index.html";
    return true;
  },

  logout() {
    localStorage.removeItem(APP.storageKeys.token);
    localStorage.removeItem(APP.storageKeys.user);
    Toast.info("Logged out.");
    window.location.href = "login.html";
  },
};