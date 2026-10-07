/**
 * Kanban board — 5 columns (Open, In Progress, Waiting, Resolved, Closed)
 * with native HTML5 drag-and-drop.
 */
const Kanban = {
  columns: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],

  render(tickets, opts = {}) {
    const cols = this.columns.map(status => {
      const items = tickets.filter(t => t.status === status);
      const titleMap = { OPEN: "Open", IN_PROGRESS: "In Progress", WAITING: "Waiting", RESOLVED: "Resolved", CLOSED: "Closed" };
      return `
        <div class="kanban-col flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-xl min-w-[260px] w-72 shrink-0" data-status="${status}">
          <div class="px-3 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2">
              ${Badge.status(status)}
              <span class="text-xs text-slate-500">${items.length}</span>
            </div>
            <button class="text-slate-400 hover:text-slate-600" title="Add ticket">+</button>
          </div>
          <div class="kanban-drop flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]" data-drop="${status}">
            ${items.map(Templates.ticketCard).join("")}
          </div>
        </div>`;
    }).join("");

    const html = `<div class="flex gap-4 overflow-x-auto pb-4" id="kanban-board">${cols}</div>`;
    if (opts.hostId) document.getElementById(opts.hostId).innerHTML = html;
    return html;
  },

  initDragDrop(opts = {}) {
    document.querySelectorAll(".kanban-drop").forEach(col => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("bg-brand-50", "dark:bg-slate-700/50"); });
      col.addEventListener("dragleave", () => col.classList.remove("bg-brand-50", "dark:bg-slate-700/50"));
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("bg-brand-50", "dark:bg-slate-700/50");
        const id = e.dataTransfer.getData("text/plain");
        const status = col.dataset.drop;
        if (id && status) {
          const t = Data.getTicket(id);
          if (t && t.status !== status) {
            const prev = t.status;
            t.status = status;
            t.history.push({ id: Utils.generateId("h"), action: "status", actorId: Auth.user()?.id || "system", from: prev, to: status, at: new Date().toISOString() });
            opts.onDrop?.(t, prev, status);
            Toast.success(`${id} → ${Utils.statusLabel(status)}`);
          }
        }
      });
    });

    document.querySelectorAll("[data-ticket-id]").forEach(card => {
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.ticketId);
        card.classList.add("opacity-50");
      });
      card.addEventListener("dragend", () => card.classList.remove("opacity-50"));
      card.addEventListener("click", (e) => {
        if (e.target.closest("button,a")) return;
        window.location.href = `ticket.html?id=${card.dataset.ticketId}`;
      });
    });
  },
};