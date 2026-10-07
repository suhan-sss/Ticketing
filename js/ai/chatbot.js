/**
 * Floating chat widget — embeddable on any page.
 * Usage:
 *   initChatWidget({
 *     welcomeMessage: "Hi! How can I help?",
 *     suggestedQuestions: ["Order status", "Talk to a human"],
 *     escalationEndpoint: "Escalate.toTicket", // or a function
 *   });
 */
function initChatWidget(opts = {}) {
  const config = Object.assign({
    position: "bottom-right",
    accentColor: "#10b981",
    welcomeMessage: "Hi! I'm your AI assistant. How can I help you today?",
    suggestedQuestions: ["Order status", "Refund policy", "Talk to a human"],
    escalationEndpoint: "Escalate.toTicket",
  }, opts);

  let open = false;
  let conversation = [];
  let busy = false;
  const STORAGE_KEY = "chat_widget_state_v1";

  // Restore from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved.conversation) conversation = saved.conversation;
  } catch (_) {}

  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversation })); } catch (_) {}
  };

  // ── DOM ──
  const fab = document.createElement("button");
  fab.className = "chat-widget-fab";
  fab.title = "Chat with AI support";
  fab.innerHTML = `<img src="assets/icons/chat-bubble.svg" alt="" style="width:24px;height:24px;filter:brightness(0) invert(1)">`;
  fab.onclick = () => setOpen(!open);

  const panel = document.createElement("div");
  panel.className = "chat-widget-panel hidden";
  panel.innerHTML = `
    <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800" style="background:${config.accentColor}; color:white;">
      <span class="ai-pulse"></span>
      <strong class="text-sm">AI Support</strong>
      <span class="ml-auto flex items-center gap-1">
        <button data-cb="minimize" title="Minimize" class="p-1 hover:bg-white/20 rounded">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
        </button>
        <button data-cb="close" title="Close" class="p-1 hover:bg-white/20 rounded">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </span>
    </div>

    <div data-cb="messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950"></div>

    <div data-cb="suggested" class="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-1.5"></div>

    <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div class="flex gap-2">
        <textarea data-cb="input" rows="1" placeholder="Type your message..."
                  class="flex-1 resize-none px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
        <button data-cb="send" class="px-3 rounded-lg text-white" style="background:${config.accentColor}">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
        </button>
      </div>
      <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>Powered by AI · responses may be inaccurate</span>
        <button data-cb="escalate" class="text-violet-600 hover:underline font-medium">Talk to a human</button>
      </div>
    </div>
  `;
  document.body.appendChild(fab);
  document.body.appendChild(panel);

  // ── helpers ──
  const $  = (sel) => panel.querySelector(sel);
  const messagesEl = $("[data-cb=messages]");
  const suggestedEl = $("[data-cb=suggested]");
  const inputEl = $("[data-cb=input]");

  function renderSuggested() {
    suggestedEl.innerHTML = config.suggestedQuestions.slice(0, 3).map(q =>
      `<button class="suggested-chip px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs hover:bg-slate-200 dark:hover:bg-slate-700">${Utils.escapeHtml(q)}</button>`
    ).join("");
    suggestedEl.querySelectorAll(".suggested-chip").forEach(b =>
      b.addEventListener("click", () => { inputEl.value = b.textContent; send(); }));
  }

  function autoGrow() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  }
  inputEl.addEventListener("input", autoGrow);

  function addMessage(role, text, meta = {}) {
    conversation.push({ role, text, time: Date.now(), ...meta });
    persist();
    renderMessages();
  }

  function renderMessages() {
    messagesEl.innerHTML = conversation.map(m => {
      if (m.role === "user") {
        return `<div class="flex justify-end">
          <div class="max-w-[80%] px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">${Utils.escapeHtml(m.text)}</div>
        </div>`;
      }
      if (m.role === "ai") {
        return `<div class="flex justify-start gap-2">
          <img src="assets/icons/ai-sparkle.svg" class="w-5 h-5 text-violet-600 mt-0.5 shrink-0">
          <div class="max-w-[80%] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 ai-message">${Utils.escapeHtml(m.text)}</div>
        </div>`;
      }
      if (m.role === "system") {
        return `<div class="text-center text-[11px] text-slate-500">${Utils.escapeHtml(m.text)}</div>`;
      }
      if (m.role === "ticket-created") {
        return `<div class="rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 p-3 text-xs">
          <div class="font-semibold text-violet-900 dark:text-violet-200">✓ Escalated to a human agent</div>
          <div class="text-violet-700 dark:text-violet-300 mt-1">Ticket <strong>${Utils.escapeHtml(m.ticketId)}</strong> created. An agent will respond within ${m.sla || "a few"} hours.</div>
        </div>`;
      }
      return "";
    }).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.id = "ai-typing";
    el.className = "flex justify-start gap-2";
    el.innerHTML = `
      <img src="assets/icons/ai-sparkle.svg" class="w-5 h-5 text-violet-600 mt-0.5 shrink-0">
      <div class="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
      </div>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() { document.getElementById("ai-typing")?.remove(); }

  async function send() {
    const text = inputEl.value.trim();
    if (!text || busy) return;
    inputEl.value = "";
    autoGrow();
    addMessage("user", text);
    busy = true;
    showTyping();

    try {
      const conversationText = conversation.filter(m => m.role === "user" || m.role === "ai")
        .slice(-6).map(m => `${m.role === "user" ? "Customer" : "AI"}: ${m.text}`).join("\n");

      const result = await LLM.query(
        conversationText + (conversation.length === 1 ? "\n(First message)" : ""),
        RAG.buildContext(text)
      );

      hideTyping();
      addMessage("ai", result.reply || "(no response)");

      // Decide: escalate?
      const shouldEscalate =
        result.escalate === true ||
        result.confidence < (AI_CONFIG.escalationThreshold ?? 0.7) ||
        /talk to (a )?human|speak to (a )?(person|agent|human)/i.test(text);

      if (shouldEscalate) {
        await runEscalation(result, text);
      }
    } catch (e) {
      hideTyping();
      addMessage("ai", "I'm having trouble connecting right now. Please try again or click 'Talk to a human' below.");
    } finally {
      busy = false;
    }
  }

  async function runEscalation(aiResult, lastUserText) {
    showTyping();
    try {
      // Try the configured endpoint first
      let ticket = null;
      if (typeof config.escalationEndpoint === "function") {
        ticket = await config.escalationEndpoint(conversation, aiResult);
      } else if (window.Escalate?.toTicket) {
        ticket = await Escalate.toTicket(conversation, aiResult);
      }
      hideTyping();
      if (ticket?.id) {
        addMessage("ticket-created", `Ticket created`, { ticketId: ticket.id, sla: ticket.slaHours });
      } else {
        addMessage("system", "I'll connect you with a human agent shortly. Please share any additional details.");
      }
    } catch (e) {
      hideTyping();
      addMessage("system", "Escalation failed — please email support@ticketdesk.io.");
    }
  }

  // ── events ──
  $("[data-cb=send]").addEventListener("click", send);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });
  $("[data-cb=minimize]").addEventListener("click", () => setOpen(false));
  $("[data-cb=close]").addEventListener("click", () => {
    setOpen(false);
    fab.classList.remove("hidden");
    fab.classList.add("hidden"); // actually hide FAB too
    fab.style.display = "none";
  });
  $("[data-cb=escalate]").addEventListener("click", async () => {
    if (busy) return;
    addMessage("user", "I'd like to talk to a human, please.");
    busy = true; showTyping();
    await runEscalation({ reply: "Connecting you…", escalate: true, confidence: 0, reason: "Customer requested human" }, "I'd like to talk to a human.");
    busy = false;
  });

  function setOpen(v) {
    open = v;
    panel.classList.toggle("hidden", !v);
    fab.classList.toggle("hidden", v);
    if (v) { inputEl.focus(); renderMessages(); }
  }

  // ── init ──
  function init() {
    if (!conversation.length) addMessage("ai", config.welcomeMessage);
    else renderMessages();
    renderSuggested();
  }

  // Wait for RAG if available; render regardless.
  if (window.RAG?.init) RAG.init().then(init).catch(init);
  else init();

  return { open: () => setOpen(true), close: () => setOpen(false), send };
}

window.initChatWidget = initChatWidget;