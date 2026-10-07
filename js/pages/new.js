/**
 * New Ticket page — full spec implementation:
 *  - Priority cards (Low/Medium/High/Urgent) with auto-SLA + urgent warning
 *  - Channel radios with icons + dynamic description placeholder
 *  - Contact search with inline "create new contact" mini-form
 *  - Assign To: Unassigned / Select Agent (searchable, least-busy first, on-leave disabled) / Round Robin
 *  - Tag input with max 5 enforcement + billing/urgent hints
 *  - Dropzone with max 5 files × 10MB each
 *  - Per-field validation with inline error messages
 *  - Submit → mock save → toast → redirect to ticket.html?id=...
 *  - Initial timeline message authored by the customer (their description)
 */
(function () {
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  let files = [];
  let tagApi;
  let selectedContact = null;
  const State = {
    priority: "MEDIUM",
    channel: "email",
    assignMode: "unassigned",
    selectedAgent: null,
  };

  // ───────────────── helpers ─────────────────
  const $ = (id) => document.getElementById(id);
  const clearErr = (id) => { const el = $("err-" + id); if (el) { el.textContent = ""; el.classList.add("hidden"); } };
  const showErr  = (id, msg) => { const el = $("err-" + id); if (el) { el.textContent = msg; el.classList.remove("hidden"); } };
  const clearAllErrs = () => ["subject","description","contact","tags","sla","files"].forEach(clearErr);

  function setPriorityCard(priority) {
    document.querySelectorAll(".priority-card").forEach(c => c.classList.toggle("selected", c.dataset.priority === priority));
    $("f-priority").value = priority;
    $("f-sla").value = APP.slaDefaults[priority];
    State.priority = priority;
    const urgent = $("urgent-warning");
    if (priority === "URGENT") { urgent.classList.remove("hidden"); $("f-sla").value = 1; }
    else urgent.classList.add("hidden");
  }

  function updateChannelVisual() {
    document.querySelectorAll(".channel-radio").forEach(label => {
      const input = label.querySelector("input");
      label.classList.toggle("has-checked", input.checked);
      label.classList.toggle("bg-brand-50", input.checked);
      label.classList.toggle("border-brand-500", input.checked);
    });
  }

  // ───────────────── validation ─────────────────
  function validate() {
    clearAllErrs();
    const errs = {};
    const subject = $("f-subject").value.trim();
    if (subject.length < 5 || subject.length > 120) errs.subject = "Subject must be 5–120 characters";

    const desc = $("f-description").value.trim();
    if (desc.length < 20) errs.description = "Description must be at least 20 characters";

    if (!selectedContact) errs.contact = "Please select or create a contact";

    const tags = tagApi ? tagApi.getTags() : [];
    if (tags.length > 5) errs.tags = "Maximum 5 tags allowed";

    const sla = +$("f-sla").value;
    if (!sla || sla < 1 || sla > 168) errs.sla = "SLA must be between 1 and 168 hours";

    if (files.length > MAX_FILES) errs.files = `Maximum ${MAX_FILES} files allowed`;

    Object.entries(errs).forEach(([k, m]) => showErr(k, m));
    return Object.keys(errs).length === 0;
  }

  // ───────────────── priority cards ─────────────────
  function bindPriorityCards() {
    document.querySelectorAll(".priority-card").forEach(card => {
      card.addEventListener("click", () => {
        clearErr("sla");
        setPriorityCard(card.dataset.priority);
      });
    });
  }

  // ───────────────── channel radios ─────────────────
  function bindChannels() {
    document.querySelectorAll('input[name="channel"]').forEach(r => {
      r.addEventListener("change", () => {
        State.channel = r.value;
        updateChannelVisual();
        const desc = $("f-description");
        desc.placeholder = r.value === "phone"
          ? "Call notes: time, duration, outcome…"
          : "Describe the issue in detail...";
      });
    });
    updateChannelVisual();
  }

  // ───────────────── contact search ─────────────────
  function bindContactSearch() {
    const search   = $("contact-search");
    const results  = $("contact-results");
    const newForm  = $("new-contact-form");

    search.addEventListener("input", Utils.debounce(() => {
      const q = search.value.toLowerCase().trim();
      if (!q) { results.classList.add("hidden"); return; }
      const matches = Data.getContacts().filter(c =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));

      if (matches.length === 0) {
        results.innerHTML = `
          <div class="p-3 text-sm text-slate-500">No contact found.</div>
          <button type="button" id="btn-show-new-contact" class="block w-full p-2 text-left text-sm text-brand-600 hover:bg-slate-50 border-t border-slate-200 dark:border-slate-800">+ Create new contact</button>`;
        results.classList.remove("hidden");
        $("btn-show-new-contact").addEventListener("click", () => {
          newForm.classList.remove("hidden");
          $("new-contact-name").value  = q.includes("@") ? "" : q.replace(/\b\w/g, c => c.toUpperCase());
          $("new-contact-email").value = q.includes("@") ? q : "";
          $("new-contact-name").focus();
        });
      } else {
        results.innerHTML = matches.map(c => `
          <button type="button" data-id="${c.id}" class="contact-result block w-full p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div class="font-medium text-slate-800 dark:text-slate-100">${Utils.escapeHtml(c.name)}</div>
            <div class="text-xs text-slate-500">${Utils.escapeHtml(c.email)} · ${Utils.escapeHtml(c.company || "—")}</div>
          </button>`).join("");
        results.classList.remove("hidden");
        results.querySelectorAll(".contact-result").forEach(b => {
          b.addEventListener("click", () => {
            selectedContact = Data.getContact(b.dataset.id);
            $("contact-display").textContent      = selectedContact.name;
            $("contact-display-email").textContent = selectedContact.email;
            $("contact-selected").classList.remove("hidden");
            results.classList.add("hidden");
            newForm.classList.add("hidden");
            search.value = "";
            clearErr("contact");
          });
        });
      }
    }, 200));

    search.addEventListener("blur", () => setTimeout(() => results.classList.add("hidden"), 200));

    $("btn-clear-contact").addEventListener("click", () => {
      selectedContact = null;
      $("contact-selected").classList.add("hidden");
    });

    $("btn-save-contact").addEventListener("click", () => {
      const name    = $("new-contact-name").value.trim();
      const email   = $("new-contact-email").value.trim();
      const company = $("new-contact-company").value.trim();
      if (!name || !email) { Toast.error("Name and email are required."); return; }
      const created = Data.addContact({ id: Utils.generateId("c"), name, email, company, phone: "" });
      selectedContact = created;
      $("contact-display").textContent       = name;
      $("contact-display-email").textContent = email;
      $("contact-selected").classList.remove("hidden");
      newForm.classList.add("hidden");
      search.value = "";
      results.classList.add("hidden");
      clearErr("contact");
      Toast.success("Contact created.");
    });
  }

  // ───────────────── assignment ─────────────────
  function bindAssignment() {
    document.querySelectorAll('input[name="assign-mode"]').forEach(r => {
      r.addEventListener("change", () => {
        State.assignMode = r.value;
        $("select-agent-block").classList.toggle("hidden", r.value !== "select");
        $("roundrobin-block").classList.toggle("hidden",  r.value !== "roundrobin");
        if (r.value === "roundrobin") {
          const next = pickRoundRobinAgent();
          $("roundrobin-next").textContent = next ? `${next.name} (${next.workload}/${next.maxLoad})` : "No agents available";
          State.selectedAgent = next ? next.id : null;
        } else if (r.value === "unassigned") {
          State.selectedAgent = null;
        }
      });
    });

    const agentSearch  = $("agent-search");
    const agentResults = $("agent-results");

    const renderAgents = (q) => {
      const all = Data.getAgents();
      const filtered = !q ? all : all.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
      // Least busy first; on-leave at bottom
      const sorted = [...filtered].sort((a, b) => {
        if (a.onLeave !== b.onLeave) return a.onLeave ? 1 : -1;
        return a.workload - b.workload;
      });
      agentResults.innerHTML = sorted.map(a => {
        const disabled = a.onLeave || a.workload >= a.maxLoad;
        const note = a.onLeave ? " · on leave" : (a.workload >= a.maxLoad ? " · full" : "");
        return `
          <button type="button" data-id="${a.id}" ${disabled ? "disabled" : ""}
            class="agent-result block w-full p-2 text-left text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800"}">
            <div class="flex justify-between items-center">
              <span class="font-medium text-slate-800 dark:text-slate-100">${Utils.escapeHtml(a.name)}${note}</span>
              <span class="text-xs text-slate-500">${a.workload}/${a.maxLoad}</span>
            </div>
          </button>`;
      }).join("");
      agentResults.classList.remove("hidden");
      agentResults.querySelectorAll(".agent-result:not([disabled])").forEach(b => {
        b.addEventListener("click", () => {
          State.selectedAgent = b.dataset.id;
          const agent = Data.getAgent(b.dataset.id);
          $("agent-display").textContent = `${agent.name} (${agent.workload}/${agent.maxLoad})`;
          $("agent-selected").classList.remove("hidden");
          agentResults.classList.add("hidden");
          agentSearch.value = "";
        });
      });
    };

    agentSearch.addEventListener("focus", () => renderAgents(""));
    agentSearch.addEventListener("input", Utils.debounce((e) => renderAgents(e.target.value), 200));
    agentSearch.addEventListener("blur", () => setTimeout(() => agentResults.classList.add("hidden"), 200));

    $("btn-clear-agent").addEventListener("click", () => {
      State.selectedAgent = null;
      $("agent-selected").classList.add("hidden");
    });
  }

  function pickRoundRobinAgent() {
    const agents = Data.getAgents().filter(a => !a.onLeave && a.workload < a.maxLoad);
    return agents.sort((a, b) => a.workload - b.workload)[0] || null;
  }

  // ───────────────── tags ─────────────────
  function bindTags() {
    tagApi = TagInput.init("tag-host", { onChange: (tags) => {
      if (tags.length > 5) { Toast.warning("Maximum 5 tags allowed."); clearErr("tags"); showErr("tags", "Maximum 5 tags allowed"); }
      else clearErr("tags");
      if (tags.includes("billing"))  Toast.info("Tip: Consider assigning this to the Finance team.");
      if (tags.includes("urgent")) {
        $("f-sla").value = 1;
        $("urgent-warning").classList.remove("hidden");
        clearErr("sla");
      }
    }});
  }

  // ───────────────── dropzone ─────────────────
  function bindDropzone() {
    const dz   = $("dropzone");
    const inp  = $("f-files");
    const list = $("files-list");

    const render = () => {
      list.innerHTML = files.map((f, i) => `
        <li class="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
          <span class="truncate">${Utils.escapeHtml(f.name)} <span class="text-slate-400">(${Utils.formatFileSize(f.size)})</span></span>
          <button data-i="${i}" type="button" class="text-rose-600 hover:underline text-xs">Remove</button>
        </li>`).join("");
      list.querySelectorAll("button[data-i]").forEach(b =>
        b.addEventListener("click", () => { files.splice(+b.dataset.i, 1); render(); clearErr("files"); }));
    };

    const addFiles = (incoming) => {
      for (const f of incoming) {
        if (f.size > MAX_FILE_SIZE) { Toast.error(`"${f.name}" exceeds 10MB limit.`); continue; }
        if (files.length >= MAX_FILES) { Toast.error(`Maximum ${MAX_FILES} files allowed.`); break; }
        files.push(f);
      }
      render();
    };

    ["dragover","drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("border-brand-500"); }));
    ["dragleave","dragend"].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove("border-brand-500")));
    dz.addEventListener("drop", (e) => addFiles([...e.dataTransfer.files]));
    inp.addEventListener("change", () => { addFiles([...inp.files]); inp.value = ""; });
  }

  // ───────────────── submit ─────────────────
  function submit(e) {
    e.preventDefault();
    if (!validate()) {
      Toast.error("Please fix the errors below.");
      // Scroll to first error
      const firstErr = document.querySelector('[id^="err-"]:not(.hidden)');
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const subject     = $("f-subject").value.trim();
    const description = $("f-description").value.trim();
    const channel     = State.channel;
    const priority    = State.priority;
    const slaHours    = +$("f-sla").value || APP.slaDefaults[priority];
    const tags        = tagApi.getTags();
    const assignedToId = State.selectedAgent || null;
    const now         = new Date().toISOString();

    const id = `TKT-${1043 + Data.getTickets().length - 20}`;
    const ticket = {
      id, subject, description, status: "OPEN", priority, channel,
      tags, contactId: selectedContact.id, assignedToId, slaHours,
      createdAt: now,
      attachments: files.map(f => ({ name: f.name, size: f.size })),
      // First message is FROM the customer (their initial description)
      messages: [{ id: Utils.generateId("m"), authorId: selectedContact.id, authorType: "customer", content: description, createdAt: now }],
      history:  [{ id: Utils.generateId("h"), action: "created", actorId: Auth.user()?.id || "system", at: now }],
    };
    Data.addTicket(ticket);
    Toast.success(`✓ Ticket #${id} created.`);
    setTimeout(() => { window.location.href = `ticket.html?id=${id}`; }, 600);
  }

  // ───────────────── live counters + init ─────────────────
  function bindCounters() {
    const subj = $("f-subject"), desc = $("f-description");
    const sc = $("subject-count"), dc = $("desc-count");
    subj.addEventListener("input", () => { sc.textContent = subj.value.length; clearErr("subject"); });
    desc.addEventListener("input", () => { dc.textContent = desc.value.length; clearErr("description"); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    Sidebar.render();
    bindPriorityCards();
    bindChannels();
    bindContactSearch();
    bindAssignment();
    bindTags();
    bindDropzone();
    bindCounters();
    setPriorityCard("MEDIUM");   // default
    $("new-form").addEventListener("submit", submit);
  });
})();