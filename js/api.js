/**
 * Fetch wrapper. Currently returns mock data — swap internals for real fetch()
 * when wiring up a backend. Adds auth header, handles 401, shows toast on error.
 */
const api = {
  _delay(ms = 120) { return new Promise(r => setTimeout(r, ms)); },

  _headers() {
    const token = localStorage.getItem(APP.storageKeys.token);
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async _handle(res) {
    if (res.status === 401) {
      localStorage.removeItem(APP.storageKeys.token);
      window.location.href = "login.html";
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      Toast.error(text || `Request failed (${res.status})`);
      throw new Error(text || "Request failed");
    }
    return res.json();
  },

  async get(url) {
    // Mock layer — return from Data instead of fetching
    await this._delay();
    if (url === "/tickets") return Data.getTickets();
    if (url === "/agents")  return Data.getAgents();
    if (url === "/rules")   return Data.getRules();
    if (url.startsWith("/tickets/")) {
      const id = url.split("/").pop();
      return Data.getTicket(id);
    }
    return null;
  },

  async post(url, data) {
    await this._delay();
    if (url === "/tickets") {
      Data.addTicket(data);
      return data;
    }
    if (url === "/rules") {
      Data.addRule(data);
      return data;
    }
    return data;
  },

  async patch(url, data) {
    await this._delay();
    if (url.startsWith("/tickets/")) {
      const id = url.split("/").pop();
      return Data.updateTicket(id, data);
    }
    if (url.startsWith("/rules/")) {
      const id = url.split("/").pop();
      const rule = Data.getRules().find(r => r.id === id);
      return Object.assign(rule, data);
    }
    return data;
  },

  async delete(url) {
    await this._delay();
    if (url.startsWith("/rules/")) {
      const id = url.split("/").pop();
      Data.deleteRule(id);
      return { ok: true };
    }
    return { ok: true };
  },
};