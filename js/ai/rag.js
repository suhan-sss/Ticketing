/**
 * RAG — Knowledge base + lightweight keyword search.
 * Production: swap searchKnowledgeBase() for a real vector DB call (Pinecone, Weaviate, faiss).
 */
const RAG = {
  /**
   * Document registry. In production this would be the index of uploaded docs.
   * Loaded synchronously here for the demo; in real life, fetched on init.
   */
  docs: [],

  async init() {
    if (this.docs.length) return;
    // Try the JSON knowledge base; fallback to whatever we have.
    try {
      const res = await fetch("../../knowledge/faqs.json");
      if (res.ok) this.docs.push({ id: "faqs.json", entries: await res.json() });
    } catch (_) {}
    try {
      const res = await fetch("../../knowledge/faq-technical.json");
      if (res.ok) this.docs.push({ id: "faq-technical.json", entries: await res.json() });
    } catch (_) {}
    // Text policies (kept inline so the demo works on file:// URLs).
    this.docs.push({
      id: "shipping-policy.txt",
      entries: [{
        id: "kb-ship", category: "shipping",
        question: "Shipping / delivery / tracking / dispatch",
        answer: "Standard domestic delivery is 3-5 business days. Express is 1-2 business days for Rs 199. Tracking is sent within 24 hours of dispatch. Holiday delays of 2-3 days expected around Diwali, Christmas, New Year.",
        keywords: ["shipping", "delivery", "tracking", "dispatch", "arrive", "shipped", "courier", "where"]
      }]
    });
    this.docs.push({
      id: "refund-policy.txt",
      entries: [{
        id: "kb-refund", category: "billing",
        question: "Refund / cancellation / money back",
        answer: "Refunds are available within 7 days. Go to Settings > Orders > Request Refund. Processing: UPI 1-3 days, cards 5-7 days. Cancellations allowed within 12 hours if not yet dispatched. Subscriptions cancel at end of billing period.",
        keywords: ["refund", "cancel", "money", "back", "return", "policy", "cancellation"]
      }]
    });
  },

  getDocs() {
    return this.docs;
  },

  /**
   * Returns the top-K relevant entries with a score in [0, 1].
   */
  search(query, k = 3) {
    const words = String(query || "").toLowerCase().split(/\W+/).filter(Boolean);
    if (!words.length) return [];
    const all = this.docs.flatMap(d => d.entries || []);
    const scored = all.map(entry => {
      const hay = [
        entry.question, entry.answer, entry.category,
        ...(entry.keywords || [])
      ].join(" ").toLowerCase();
      const matched = words.filter(w => hay.includes(w)).length;
      const score = matched / words.length;
      return { ...entry, score };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

    return scored;
  },

  /**
   * Build a compact context string for the LLM prompt.
   */
  buildContext(query) {
    const hits = this.search(query, 3);
    if (!hits.length) return "No relevant entries in knowledge base.";
    return hits.map((h, i) => `[${i+1}] (${h.category}) ${h.answer}`).join("\n");
  },
};

window.RAG = RAG;