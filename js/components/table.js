/**
 * Table view — sortable columns, pagination.
 */
const Table = {
  _sortKey: "createdAt",
  _sortDir: "desc",

  sortBy(key) {
    if (this._sortKey === key) this._sortDir = this._sortDir === "asc" ? "desc" : "asc";
    else { this._sortKey = key; this._sortDir = "asc"; }
  },

  render(tickets, page = 1, perPage = APP.pageSize) {
    const sorted = [...tickets].sort((a, b) => {
      const av = a[this._sortKey]; const bv = b[this._sortKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return this._sortDir === "asc" ? cmp : -cmp;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    page = Math.min(Math.max(1, page), totalPages);
    const slice = sorted.slice((page - 1) * perPage, page * perPage);

    const rows = slice.map(t => Templates.ticketRow(t)).join("");
    const headers = [
      { k: "id",         l: "ID"        },
      { k: "subject",    l: "Subject"   },
      { k: "priority",   l: "Priority"  },
      { k: "status",     l: "Status"    },
      { k: "channel",    l: "Channel"   },
      { k: "assignedToId",l: "Assignee" },
      { k: "createdAt",  l: "Created"   },
    ].map(h => `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800" data-sort="${h.k}">
      ${h.l} ${this._sortKey === h.k ? (this._sortDir === "asc" ? "↑" : "↓") : ""}
    </th>`).join("");

    const html = `
      <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead class="bg-slate-50 dark:bg-slate-800/50">${headers}</thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">${rows || `<tr><td colspan="7" class="px-3 py-8 text-center text-sm text-slate-500">No tickets match your filters.</td></tr>`}</tbody>
        </table>
      </div>`;

    const pager = `
      <div class="mt-3 flex items-center justify-between text-sm text-slate-500">
        <div>Page ${page} of ${totalPages} · ${sorted.length} ticket${sorted.length === 1 ? "" : "s"}</div>
        <div class="flex gap-1">
          <button class="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40" data-page="prev" ${page === 1 ? "disabled" : ""}>‹ Prev</button>
          <button class="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40" data-page="next" ${page === totalPages ? "disabled" : ""}>Next ›</button>
        </div>
      </div>`;

    return { html: html + pager, totalPages, page };
  },

  bind(hostId, tickets, onChange) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.querySelectorAll("[data-sort]").forEach(th => {
      th.addEventListener("click", () => { this.sortBy(th.dataset.sort); onChange(); });
    });
    host.addEventListener("click", (e) => {
      const t = e.target.closest("tr[data-ticket-id]");
      if (t && !e.target.closest("button")) {
        window.location.href = `ticket.html?id=${t.dataset.ticketId}`;
      }
    });
  },
};