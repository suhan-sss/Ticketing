/**
 * Ticket detail page — timeline, reply box, sidebar dropdowns, quick actions.
 */
(function () {
  let ticketId;
  let ticket;

  function refresh() {
    ticket = Data.getTicket(ticketId);
    if (!ticket) {
      document.getElementById("ticket-host").innerHTML = `
        <div class="text-center py-20">
          <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">Ticket not found</h2>
          <a href="index.html" class="text-brand-600 hover:underline mt-2 inline-block">← Back to tickets</a>
        </div>`;
      return;
    }
    renderHeader();
    renderTimeline();
    renderSidebar();
    bindReply();
  }

  function renderHeader() {
    const contact = Data.getContact(ticket.contactId);
    const aiMeta = ticket.aiMetadata;
    document.getElementById("ticket-host").innerHTML = `
      <div class="flex flex-wrap items-start gap-3 mb-4">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-mono text-slate-500">${ticket.id}</div>
          <h1 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-0.5">${Utils.escapeHtml(ticket.subject)}</h1>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            ${Badge.status(ticket.status)} ${Badge.priority(ticket.priority)} ${Badge.channel(ticket.channel)}
            <span>·</span><span>From <strong class="text-slate-700 dark:text-slate-300">${Utils.escapeHtml(contact?.name || "—")}</strong></span>
            <span>·</span><span>Opened ${Utils.formatRelativeTime(ticket.createdAt)}</span>
            <span>·</span>${SLAIndicator.render(ticket)}
            ${aiMeta ? `
              <span>·</span>
              <span class="ai-classified-badge" title="Escalated by AI bot">
                <img src="assets/icons/ai-sparkle.svg" class="w-3 h-3"> AI-Escalated
                ${aiMeta.confidence != null ? `· ${(aiMeta.confidence * 100).toFixed(0)}% conf` : ""}
              </span>
            ` : ""}
          </div>
        </div>
        <div class="flex gap-2">
          <button id="btn-resolve" class="px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Resolve</button>
          <button id="btn-escalate" class="px-3 py-1.5 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700">Escalate</button>
          <button id="btn-merge" class="px-3 py-1.5 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Merge</button>
          <button id="btn-duplicate" class="px-3 py-1.5 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Duplicate</button>
        </div>
      </div>
      ${aiMeta ? `
      <div class="mt-3 flex flex-wrap items-start gap-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-sm">
        <img src="assets/icons/ai-sparkle.svg" class="w-5 h-5 text-violet-600 mt-0.5">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-violet-900 dark:text-violet-200">AI Escalation Summary</div>
          <div class="text-violet-800 dark:text-violet-300 mt-0.5 text-xs space-y-1">
            <div><strong>Reason:</strong> ${Utils.escapeHtml(aiMeta.reason || "Low confidence / human requested")}</div>
            <div><strong>Attempts before escalation:</strong> ${aiMeta.attempts ?? "—"}</div>
            ${aiMeta.suggestedReply ? `<div class="mt-1"><strong>Suggested draft:</strong> <span class="italic">"${Utils.escapeHtml(aiMeta.suggestedReply.slice(0,140))}${aiMeta.suggestedReply.length>140?"…":""}"</span></div>` : ""}
          </div>
        </div>
        <button id="btn-ai-suggest" class="self-start shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium">
          <img src="assets/icons/ai-sparkle.svg" class="w-3 h-3"> AI Reply
        </button>
      </div>` : `
      <div class="mt-3">
        <button id="btn-ai-suggest" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs font-medium">
          <img src="assets/icons/ai-sparkle.svg" class="w-4 h-4"> AI Suggested Reply
        </button>
      </div>`}`;

    document.getElementById("btn-resolve").addEventListener("click",  () => changeStatus("RESOLVED"));
    document.getElementById("btn-escalate").addEventListener("click", () => changePriority("URGENT"));
    document.getElementById("btn-merge").addEventListener("click",    () => Toast.info("Merge flow would open here."));
    document.getElementById("btn-duplicate").addEventListener("click",() => duplicateTicket());

    // AI Suggested Reply button
    document.getElementById("btn-ai-suggest")?.addEventListener("click", suggestAIReply);
  }

  function renderTimeline() {
    document.getElementById("timeline-host").innerHTML = Timeline.render(ticket.messages);
  }

  function renderSidebar() {
    const contact = Data.getContact(ticket.contactId);
    const assignee = Data.getAgent(ticket.assignedToId);
    document.getElementById("sidebar-host").innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm">Properties</h3>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Status</label>
          <select id="dd-status" class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
            ${["OPEN","IN_PROGRESS","WAITING","RESOLVED","CLOSED"].map(s => `<option value="${s}" ${s===ticket.status?"selected":""}>${Utils.statusLabel(s)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Priority</label>
          <select id="dd-priority" class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
            ${["LOW","MEDIUM","HIGH","URGENT"].map(p => `<option value="${p}" ${p===ticket.priority?"selected":""}>${Utils.priorityLabel(p)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-1">Assignee</label>
          <select id="dd-agent" class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
            <option value="">Unassigned</option>
            ${Data.getAgents().map(a => `<option value="${a.id}" ${a.id===ticket.assignedToId?"selected":""} ${a.onLeave?"disabled":""}>${Utils.escapeHtml(a.name)}${a.onLeave?" (on leave)":""}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">Customer</h3>
        <div class="text-sm text-slate-700 dark:text-slate-300">${Utils.escapeHtml(contact?.name || "—")}</div>
        <div class="text-xs text-slate-500">${Utils.escapeHtml(contact?.email || "")}</div>
        <div class="text-xs text-slate-500">${Utils.escapeHtml(contact?.phone || "")}</div>
        <div class="text-xs text-slate-500 mt-1">${Utils.escapeHtml(contact?.company || "")}</div>
      </div>

      ${renderAIClassification()}

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">Tags</h3>
        <div class="flex flex-wrap gap-1">${(ticket.tags || []).map(Badge.tag).join("") || `<span class="text-xs text-slate-500">No tags</span>`}</div>
      </div>

      ${ticket.attachments?.length ? `
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">Attachments</h3>
        <ul class="space-y-1 text-sm">
          ${ticket.attachments.map(a => `<li class="flex items-center justify-between gap-2"><span class="truncate">${Utils.escapeHtml(a.name)}</span><span class="text-xs text-slate-400">${Utils.formatFileSize(a.size)}</span></li>`).join("")}
        </ul>
      </div>` : ""}

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">History</h3>
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">${ticket.history.map(Templates.historyItem).join("")}</ul>
      </div>`;

    document.getElementById("dd-status").addEventListener("change",   (e) => changeStatus(e.target.value));
    document.getElementById("dd-priority").addEventListener("change",(e) => changePriority(e.target.value));
    document.getElementById("dd-agent").addEventListener("change",    (e) => changeAgent(e.target.value));
  }

  function bindReply() {
    const ta = document.getElementById("reply-text");
    const send = document.getElementById("reply-send");
    const sendFn = () => {
      const text = ta.value.trim();
      if (!text) return;
      ticket.messages.push({
        id: Utils.generateId("m"),
        authorId: Auth.user()?.id || "system",
        authorType: "agent",
        content: text,
        createdAt: new Date().toISOString(),
      });
      ta.value = "";
      renderTimeline();
      Toast.success("Reply sent.");
    };
    send.addEventListener("click", sendFn);
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendFn(); });
  }

  function logHistory(action, from, to) {
    ticket.history.push({
      id: Utils.generateId("h"),
      action, actorId: Auth.user()?.id || "system", from, to,
      at: new Date().toISOString(),
    });
  }

  function changeStatus(next) {
    const prev = ticket.status;
    if (prev === next) return;
    ticket.status = next;
    logHistory("status", prev, next);
    renderHeader(); renderSidebar();
    Toast.success(`Status → ${Utils.statusLabel(next)}`);
  }
  function changePriority(next) {
    const prev = ticket.priority;
    if (prev === next) return;
    ticket.priority = next;
    logHistory("priority", prev, next);
    renderHeader(); renderSidebar();
    Toast.success(`Priority → ${Utils.priorityLabel(next)}`);
  }
  function changeAgent(next) {
    const prev = ticket.assignedToId;
    if (prev === next) return;
    ticket.assignedToId = next || null;
    logHistory("assigned", prev, next);
    renderSidebar();
    Toast.success("Assignee updated.");
  }
  async function duplicateTicket() {
    const ok = await Modal.confirm("Duplicate this ticket? A new ticket will be created with the same details.", { yesText: "Duplicate" });
    if (!ok) return;
    const id = `TKT-${1043 + Data.getTickets().length - 20}`;
    const copy = JSON.parse(JSON.stringify(ticket));
    copy.id = id;
    copy.status = "OPEN";
    copy.createdAt = new Date().toISOString();
    copy.messages = [{ id: Utils.generateId("m"), authorId: Auth.user()?.id || "system", authorType: "system", content: `Duplicated from ${ticket.id}.`, createdAt: copy.createdAt }];
    copy.history  = [{ id: Utils.generateId("h"), action: "created", actorId: Auth.user()?.id || "system", at: copy.createdAt }];
    Data.addTicket(copy);
    Toast.success(`Created duplicate ${id}.`);
    window.location.href = `ticket.html?id=${id}`;
  }

  // ───────────────── AI features ─────────────────
  function renderAIClassification() {
    const tags = (ticket.tags || []).filter(t => t !== "ai-escalated");
    const sentiment = inferSentiment(ticket);
    const confidence = ticket.aiMetadata?.confidence;
    const conf = confidence != null
      ? `<div class="mt-2"><div class="flex items-center justify-between text-xs text-slate-500 mb-1"><span>AI confidence</span><span>${(confidence*100).toFixed(0)}%</span></div><div class="confidence-bar"><div style="width:${confidence*100}%; background:${confidence>=0.8?"#10b981":confidence>=0.6?"#f59e0b":"#ef4444"}"></div></div></div>`
      : "";
    return `
      <div class="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl border border-violet-200 dark:border-violet-800 p-4">
        <div class="flex items-center gap-2 mb-2">
          <img src="assets/icons/ai-sparkle.svg" class="w-4 h-4 text-violet-600">
          <h3 class="font-semibold text-violet-900 dark:text-violet-200 text-sm">AI Classification</h3>
        </div>
        <dl class="text-xs space-y-1.5">
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Category</dt><dd class="font-medium text-slate-800 dark:text-slate-100">${Utils.escapeHtml(tags[0] || "general")}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Sentiment</dt><dd class="font-medium ${sentiment.tone}">${sentiment.label}</dd></div>
          <div class="flex justify-between gap-2"><dt class="text-slate-500">Suggested team</dt><dd class="font-medium text-slate-800 dark:text-slate-100">${Utils.escapeHtml(suggestTeam(tags))}</dd></div>
        </dl>
        ${conf}
      </div>`;
  }

  function inferSentiment(t) {
    const text = ((t.subject || "") + " " + (t.description || "") + " " + (t.messages || []).map(m => m.content).join(" ")).toLowerCase();
    const negative = ["angry","frustrated","urgent","immediately","not working","broken","refund","disappointed","cancel","complaint","horrible"].filter(w => text.includes(w)).length;
    if (negative >= 2) return { label: "⚠ Frustrated", tone: "text-rose-600" };
    if (negative === 1) return { label: "Concerned",    tone: "text-amber-600" };
    return { label: "Neutral", tone: "text-emerald-600" };
  }

  function suggestTeam(tags) {
    if (tags.includes("billing"))   return "Billing";
    if (tags.includes("technical") || tags.includes("bug")) return "Technical / Tier 2";
    if (tags.includes("shipping"))  return "Logistics";
    if (tags.includes("onboarding"))return "Customer Success";
    return "General Support";
  }

  let lastSuggestion = "";
  async function suggestAIReply() {
    const btn = document.getElementById("btn-ai-suggest");
    const ta  = document.getElementById("reply-text");
    if (!ta) return;
    btn.disabled = true;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    try {
      const ctx = `Subject: ${ticket.subject}\nDescription: ${ticket.description}\nTags: ${(ticket.tags||[]).join(", ")}`;
      const result = await LLM.query(
        `Draft a helpful reply to this support ticket. Use 2-3 sentences. Be empathetic and concrete.`,
        ctx
      );
      lastSuggestion = result.reply || "(no suggestion)";
      ta.value = lastSuggestion;
      ta.focus();
      Toast.success("AI draft inserted. Edit as needed before sending.");
    } catch (e) {
      Toast.error("AI suggestion failed: " + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ticketId = Utils.getQueryParam("id");
    if (!ticketId) { window.location.href = "index.html"; return; }
    Sidebar.render();
    refresh();
  });
})();