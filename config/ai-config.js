/**
 * AI Configuration — provider, model, API key, thresholds, prompts.
 * Editable from Settings → AI Configuration (admin only). Persists to localStorage.
 */
const AI_CONFIG = (() => {
  const defaults = {
    provider: "mock",           // "openai" | "anthropic" | "gemini" | "mock"
    apiKey: "",                 // user fills this in
    model: "mock-fast",
    maxTokens: 500,
    temperature: 0.3,
    systemPrompt: `You are a helpful customer support AI for TicketDesk. Rules:
- Answer ONLY from the provided knowledge base context.
- If you don't know, say "I'm not sure about that. Let me connect you to a human agent." and set escalate=true with low confidence.
- Keep replies under 3 sentences.
- If customer asks to talk to a human, set escalate=true.
- Detect urgency: words like "urgent", "immediately", "frustrated", "broken" → set priority HIGH or URGENT.
- Classify the issue into one of: billing, technical, shipping, general.
- Detect sentiment: frustrated / concerned / neutral.
- Respond ONLY with JSON: { "reply": "...", "escalate": false, "priority": "MEDIUM", "tags": ["..."], "confidence": 0.92, "category": "...", "sentiment": "neutral", "reason": "..." }`,
    escalationThreshold: 0.7,
    maxAttempts: 3,
    autoClassify: true,
    suggestReply: true,
    detectSentiment: true,
    welcomeMessage: "Hi! I'm your AI assistant. How can I help you today?",
    suggestedQuestions: ["Where is my order?", "Refund policy", "Talk to a human"],
  };

  // Merge any saved overrides from localStorage.
  try {
    const saved = JSON.parse(localStorage.getItem("AI_CONFIG") || "{}");
    return Object.assign({}, defaults, saved);
  } catch (_) {
    return defaults;
  }
})();