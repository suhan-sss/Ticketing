/**
 * Ticket list page — table + kanban, search, filter, pagination, drag-and-drop.
 */
(function () {
  const State = {
    view: "table",            // "table" | "kanban"
    page: 1,
    search: "",
    filters: { priority: "", status: "", channel: "", agent: "" },
  };

  function applyFilters() {
    let t = Data.getTickets();
    if (State.search) {
      const s = State.search.toLowerCase();
      t = t.filter(x =>
        x.id.toLowerCase().includes(s) ||
        x.subject.toLowerCase().includes(s) ||
        (Data.getContact(x.contactId)?.name || "").toLowerCase().includes(s)
      );
    }
    if (State.filters.priority) t = t.filter(x => x.priority === State.filters.priority);
    if (State.filters.status)   t = t.filter(x => x.status === State.filters.status);
    if (State.filters.channel)  t = t.filter(x => x.channel === State.filters.channel);
    if (State.filters.agent)    t = t.filter(x => x.assignedToId === State.filters.agent);
    return t;
  }

  function render() {
    const filtered = applyFilters();
    WorkloadWidget.render("workload-host");

    if (State.view === "kanban") {
      Kanban.render(filtered, { hostId: "view-host" });
      Kanban.initDragDrop({ onDrop: () => render() });
    } else {
      const out = Table.render(filtered, State.page, APP.pageSize);
      document.getElementById("view-host").innerHTML = out.html;
      Table.bind("view-host", filtered, render);
      document.querySelector('[data-page="prev"]')?.addEventListener("click", () => { State.page--; render(); });
      document.querySelector('[data-page="next"]')?.addEventListener("click", () => { State.page++; render(); });
    }
    updateCounts(filtered);
  }

  function updateCounts(filtered) {
    const counts = { OPEN: 0, IN_PROGRESS: 0, WAITING: 0, RESOLVED: 0, CLOSED: 0 };
    filtered.forEach(t => counts[t.status]++);
    document.getElementById("count-open").textContent    = counts.OPEN;
    document.getElementById("count-progress").textContent = counts.IN_PROGRESS;
    document.getElementById("count-waiting").textContent  = counts.WAITING;
    document.getElementById("count-resolved").textContent = counts.RESOLVED;
  }

  function bindControls() {
    // View toggle
    document.querySelectorAll("[data-view]").forEach(b => {
      b.addEventListener("click", () => {
        State.view = b.dataset.view;
        document.querySelectorAll("[data-view]").forEach(x => x.classList.replace("bg-brand-600","bg-white"));
        b.classList.replace("bg-white","bg-brand-600");
        b.classList.toggle("text-white", true);
        document.querySelectorAll("[data-view]:not([data-view='" + State.view + "'])").forEach(x => x.classList.remove("text-white"));
        render();
      });
    });

    // Search
    const search = document.getElementById("search");
    search.addEventListener("input", Utils.debounce(() => { State.search = search.value; State.page = 1; render(); }, 200));

    // Filters
    ["priority","status","channel","agent"].forEach(k => {
      const el = document.getElementById("filter-" + k);
      el.addEventListener("change", () => { State.filters[k] = el.value; State.page = 1; render(); });
    });

    // Populate agent filter
    const agentSel = document.getElementById("filter-agent");
    agentSel.innerHTML = `<option value="">All agents</option>` + Data.getAgents().map(Templates.agentOption).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    Sidebar.render();
    bindControls();
    render();
  });
})();