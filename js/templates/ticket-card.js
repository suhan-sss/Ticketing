/**
 * Templates are exposed via window.Templates so component files can use them.
 */
window.Templates = {
  ticketCard(t) {
    const agent = Data.getAgent(t.assignedToId);
    const contact = Data.getContact(t.contactId);
    const initials = (contact?.name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
    return `
      <div draggable="true" data-ticket-id="${t.id}" class="card-ticket bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:shadow-md transition cursor-pointer">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-mono text-slate-500">${t.id}</span>
          ${Badge.priority(t.priority)}
        </div>
        <div class="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2 mb-2">${Utils.escapeHtml(t.subject)}</div>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-1.5 min-w-0">
            <div class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-[10px] font-bold shrink-0">${initials}</div>
            <span class="truncate">${Utils.escapeHtml(contact?.name || "")}</span>
          </div>
          ${SLAIndicator.render(t)}
        </div>
        <div class="mt-2 flex flex-wrap gap-1">
          ${(t.tags || []).map(Badge.tag).join("")}
        </div>
      </div>`;
  },

  ticketRow(t) {
    const agent = Data.getAgent(t.assignedToId);
    const contact = Data.getContact(t.contactId);
    return `
      <tr data-ticket-id="${t.id}" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
        <td class="px-3 py-2 text-xs font-mono text-slate-500">${t.id}</td>
        <td class="px-3 py-2">
          <div class="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1">${Utils.escapeHtml(t.subject)}</div>
          <div class="text-xs text-slate-500">${Utils.escapeHtml(contact?.name || "")}</div>
        </td>
        <td class="px-3 py-2">${Badge.priority(t.priority)}</td>
        <td class="px-3 py-2">${Badge.status(t.status)}</td>
        <td class="px-3 py-2">${Badge.channel(t.channel)}</td>
        <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
          ${agent ? `<div class="flex items-center gap-1.5"><img src="assets/avatars/${agent.avatar}" class="w-5 h-5 rounded-full bg-slate-200" alt=""><span>${Utils.escapeHtml(agent.name)}</span></div>` : "—"}
        </td>
        <td class="px-3 py-2 text-xs text-slate-500">${Utils.formatRelativeTime(t.createdAt)}</td>
      </tr>`;
  },

  messageBubble(m) {
    return Timeline.render([m]);
  },

  ruleCard(r) {
    const whenText = r.when.map(c => {
      const field = ConditionBuilder.fields.find(f => f.v === c.field);
      const op    = ConditionBuilder.operators.find(o => o.v === c.operator);
      return `${field?.l || c.field} ${op?.l || c.operator} ${Utils.escapeHtml(c.value)}`;
    }).join(" AND ");
    const thenText = r.then.map(a => `${a.action}: ${Utils.escapeHtml(a.value)}`).join(" → ");
    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-slate-800 dark:text-slate-100 truncate">${Utils.escapeHtml(r.name)}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full ${r.enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}">${r.enabled ? "Active" : "Paused"}</span>
            </div>
            <div class="mt-2 text-xs text-slate-500 space-y-1">
              <div><span class="font-semibold text-slate-600 dark:text-slate-400">When:</span> ${whenText || "—"}</div>
              <div><span class="font-semibold text-slate-600 dark:text-slate-400">Then:</span> ${thenText || "—"}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" data-rule-toggle="${r.id}" ${r.enabled ? "checked" : ""} class="sr-only peer">
              <div class="w-9 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
            <button data-rule-del="${r.id}" class="p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-500" title="Delete">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  },

  agentOption(a) {
    return `<option value="${a.id}">${Utils.escapeHtml(a.name)} (${a.workload}/${a.maxLoad})</option>`;
  },

  historyItem(h) {
    const actor = h.actorId === "system" ? "System" :
                  (Data.getAgent(h.actorId)?.name || Data.getContact(h.actorId)?.name || h.actorId);
    let text = "";
    if (h.action === "created") text = "Ticket created";
    else if (h.action === "assigned") text = `Assigned to ${Data.getAgent(h.to)?.name || "—"}`;
    else if (h.action === "status") text = `Status: ${Utils.statusLabel(h.from)} → ${Utils.statusLabel(h.to)}`;
    else if (h.action === "priority") text = `Priority: ${Utils.priorityLabel(h.from)} → ${Utils.priorityLabel(h.to)}`;
    else text = h.action;
    return `
      <li class="flex gap-3 py-2">
        <div class="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mt-2 shrink-0"></div>
        <div class="flex-1 text-sm">
          <div class="text-slate-700 dark:text-slate-300">${text}</div>
          <div class="text-xs text-slate-500">by ${Utils.escapeHtml(actor)} · ${Utils.formatRelativeTime(h.at)}</div>
        </div>
      </li>`;
  },
};