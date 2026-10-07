/**
 * Generic helpers used across pages.
 */
const Utils = {
  /** "2h ago" / "Just now" / "Yesterday" */
  formatRelativeTime(iso) {
    const then = new Date(iso).getTime();
    const now  = Date.now();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60)        return "Just now";
    if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800)    return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
  },

  /** "245 KB", "1.2 MB" */
  formatFileSize(bytes) {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  },

  /** Debounce */
  debounce(fn, wait = 250) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  },

  /** Escape user content before injecting as HTML */
  escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  /** Random ID */
  generateId(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  },

  /** Returns "green" / "yellow" / "red" given hours-left */
  getSLAColor(hoursLeft) {
    if (hoursLeft <= 1)  return "red";
    if (hoursLeft <= 4)  return "yellow";
    return "green";
  },

  /** Calculate SLA hours-left from ticket createdAt + slaHours */
  getHoursLeft(ticket) {
    const created = new Date(ticket.createdAt).getTime();
    const due = created + ticket.slaHours * 3600 * 1000;
    return Math.max(0, (due - Date.now()) / 3600 / 1000);
  },

  /** Read URL query param */
  getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  /** Format date for display */
  formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  },

  /** Pretty status label */
  statusLabel(s)  { return s.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); },
  priorityLabel(p){ return p.charAt(0) + p.slice(1).toLowerCase(); },
};