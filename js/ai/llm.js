/**
 * LLM wrapper — abstracts OpenAI / Anthropic / Gemini / Mock.
 * Exposes: LLM.query(userMessage, context?) → { reply, escalate, priority, tags, confidence, category, sentiment, reason, _mock }
 *
 * Mock mode is automatic when no API key is configured. Add a key in
 * Settings → AI Configuration (stored in localStorage) to switch to live mode.
 */
const LLM = {
  provider: () => AI_CONFIG.provider || "mock",

  /**
   * Main entry point.
   */
  async query(userMessage, context = "") {
    const provider = this.provider();
    const key = AI_CONFIG.apiKey || localStorage.getItem("AI_API_KEY") || "";
    const model = AI_CONFIG.model || this._defaultModel(provider);

    // Mock mode (no key, or explicit "mock" provider)
    if (provider === "mock" || !key) {
      return this._mock(userMessage, context);
    }

    try {
      if (provider === "openai")    return await this._openai(userMessage, context, key, model);
      if (provider === "anthropic") return await this._anthropic(userMessage, context, key, model);
      if (provider === "gemini")    return await this._gemini(userMessage, context, key, model);
    } catch (e) {
      console.warn("[LLM] Live call failed, falling back to mock:", e.message);
      return this._mock(userMessage, context);
    }
    return this._mock(userMessage, context);
  },

  _defaultModel(provider) {
    return ({ openai: "gpt-4o-mini", anthropic: "claude-haiku-4-5", gemini: "gemini-1.5-flash", mock: "mock" })[provider] || "mock";
  },

  // ── Provider implementations ─────────────────────────────
  async _openai(message, context, key, model) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, max_tokens: AI_CONFIG.maxTokens || 500, temperature: AI_CONFIG.temperature ?? 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: this._systemPrompt() + "\n\nRespond with JSON: { reply, escalate, priority, tags, confidence, category, sentiment, reason }" },
          { role: "user",   content: `Knowledge:\n${context}\n\nCustomer: ${message}` }
        ]
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return this._parse(data.choices[0].message.content);
  },

  async _anthropic(message, context, key, model) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model, max_tokens: AI_CONFIG.maxTokens || 500,
        system: this._systemPrompt() + "\n\nRespond with a JSON object only.",
        messages: [{ role: "user", content: `Knowledge:\n${context}\n\nCustomer: ${message}` }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return this._parse(data.content[0].text);
  },

  async _gemini(message, context, key, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${this._systemPrompt()}\n\nKnowledge:\n${context}\n\nCustomer: ${message}\n\nRespond with JSON only.` }] }],
        generationConfig: { temperature: AI_CONFIG.temperature ?? 0.3, maxOutputTokens: AI_CONFIG.maxTokens || 500 }
      })
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    return this._parse(data.candidates[0].content.parts[0].text);
  },

  _systemPrompt() {
    return AI_CONFIG.systemPrompt || `You are a helpful customer support AI. Answer ONLY from the provided knowledge base. Keep replies under 3 sentences. If unsure or the customer asks for a human, set escalate=true and confidence below 0.7. Detect urgency from words like "urgent"/"frustrated"/"immediately". Respond with JSON: { reply, escalate, priority, tags, confidence, category, sentiment, reason }.`;
  },

  _parse(text) {
    try {
      const m = String(text || "").match(/\{[\s\S]*\}/);
      return JSON.parse(m ? m[0] : text);
    } catch (_) {
      return { reply: text, escalate: false, confidence: 0.6 };
    }
  },

  // ── Mock implementation ─────────────────────────────
  _mock(message, context) {
    const t = (message || "").toLowerCase();

    if (/talk to (a )?human|speak to (a )?(person|agent|human)|connect.*(agent|human)|i want (a )?(human|agent)|escalate/.test(t)) {
      return this._r("I'd be happy to connect you with a human agent. Creating a ticket now…", true, 0.95, "MEDIUM", ["general"], "general", "neutral", "Customer asked for a human");
    }
    if (/(order|tracking|where is my|delivery|shipped|package)/.test(t)) {
      return this._r("Standard delivery takes 3-5 business days. Once dispatched you'll receive a tracking link by email within 24 hours. For urgent items we offer 1-2 day express shipping.", false, 0.92, "LOW", ["shipping"], "shipping", "neutral", null);
    }
    if (/(refund|money back|return|cancel|payment.*back|chargeback)/.test(t)) {
      return this._r("We offer a 7-day refund policy. Go to Settings > Orders > Request Refund. Refunds take 5-7 business days to your original payment method.", false, 0.88, "MEDIUM", ["billing", "refund"], "billing", "neutral", null);
    }
    if (/(password|login|reset|sign in|signin|can'?t log|cannot log|forgot)/.test(t)) {
      return this._r("To reset your password, go to the login page and click 'Forgot Password'. You'll get an email with a link valid for 24 hours.", false, 0.93, "LOW", ["login"], "technical", "neutral", null);
    }
    if (/(invoice|gst|tax|bill|receipt)/.test(t)) {
      return this._r("You can download invoices from Settings > Billing > Invoices. To add GSTIN, edit it in your billing settings.", false, 0.9, "LOW", ["billing"], "billing", "neutral", null);
    }
    if (/(crash|crashes|freeze|won'?t open|not opening|stuck|hang)/.test(t)) {
      return this._r("Try force-closing the app, restarting your device, and reinstalling the latest version. If the issue persists, share your device model + OS version.", true, 0.45, "HIGH", ["bug", "mobile"], "technical", "concerned", "No automated fix known; needs human investigation");
    }
    if (/(api|webhook|integration|developer|sdk|sandbox)/.test(t)) {
      return this._r("Developer documentation is at docs.ticketdesk.io. You'll find API references, webhook payloads, and SDKs for Node, Python and Go.", false, 0.86, "LOW", ["technical"], "technical", "neutral", null);
    }
    if (/(urgent|frustrated|angry|immediately|horrible|disappointed)/.test(t)) {
      return this._r("I understand your frustration. Let me connect you with a human agent who can resolve this right away.", true, 0.4, "URGENT", ["general"], "general", "frustrated", "Customer expressed urgency");
    }
    if (/(hours|contact|phone|email|call|reach)/.test(t)) {
      return this._r("I'm available 24/7 here. For phone support call 1800-XXX-XXXX (Mon-Fri, 9AM-6PM IST) or email support@ticketdesk.io.", false, 0.91, "LOW", ["general"], "general", "neutral", null);
    }
    return this._r("I'm not sure I have the answer to that. Let me connect you with a human agent.", true, 0.35, "MEDIUM", ["general"], "general", "neutral", "Unknown question");
  },

  _r(reply, escalate, confidence, priority, tags, category, sentiment, reason) {
    return { reply, escalate, confidence, priority, tags, category, sentiment, reason, _mock: true };
  },
};

window.LLM = LLM;