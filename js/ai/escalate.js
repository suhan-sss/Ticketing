/**
 * Escalation bridge — AI creates a real ticket when it can't resolve.
 * Uses Data.addTicket() (mock layer) or POST /api/tickets (production).
 */
const Escalate = {
  /**
   * Convert a chat conversation into ticket fields.
   */
  buildTicketData(conversation, aiResult, customerInfo = {}) {
    const firstUser = conversation.find(m => m.role === "user");
    const userText = (firstUser?.text || "").trim();
    const subject = (userText.length > 80 ? userText.slice(0, 80) + "…" : userText) || "AI escalation – general query";

    const description =
      conversation
        .map(m => `[${m.role === "user" ? "Customer" : "AI Bot"}] ${m.text}  (${Utils.formatRelativeTime(m.time)})`)
        .join("\n\n") +
      `\n\n---\nEscalated by AI. Confidence: ${aiResult.confidence ?? "n/a"}.\n` +
      `Reason: ${aiResult.reason || "Low confidence / human requested"}`;

    return {
      subject,
      description,
      priority: aiResult.priority || "MEDIUM",
      tags: Array.from(new Set([...(aiResult.tags || []), "ai-escalated"])),
      channel: "chat",
      contactId: customerInfo.contactId || null,
      contactName: customerInfo.name || "Anonymous Customer",
      aiMetadata: {
        escalatedBy: "ai",
        confidence: aiResult.confidence ?? null,
        attempts: conversation.filter(m => m.role === "ai").length,
        suggestedReply: aiResult.draftReply || null,
        reason: aiResult.reason || null,
        sentiment: aiResult.sentiment || null,
        category: aiResult.category || null,
        at: new Date().toISOString(),
      },
    };
  },

  /**
   * Create a ticket in the data layer. Returns the new ticket object.
   */
  async toTicket(conversation, aiResult, customerInfo) {
    const data = this.buildTicketData(conversation, aiResult, customerInfo);

    // In production: POST /api/tickets (real fetch). Here we use the mock layer.
    const id = `TKT-${1043 + (window.Data?.getTickets?.().length ?? 20)}`;
    const now = new Date().toISOString();
    const contactId = data.contactId || (() => {
      // Auto-create a contact row so the ticket is self-contained.
      const c = {
        id: Utils.generateId("c"),
        name: data.contactName,
        email: customerInfo.email || `${data.contactName.toLowerCase().replace(/\s+/g, ".")}@anonymous.io`,
        company: customerInfo.company || "",
        phone: customerInfo.phone || "",
      };
      if (window.Data?.addContact) Data.addContact(c);
      return c.id;
    })();

    const ticket = {
      id,
      subject: data.subject,
      description: data.description,
      status: "OPEN",
      priority: data.priority,
      channel: data.channel,
      tags: data.tags,
      contactId,
      assignedToId: null,
      slaHours: APP.slaDefaults[data.priority],
      createdAt: now,
      attachments: [],
      aiMetadata: data.aiMetadata,
      messages: [
        { id: Utils.generateId("m"), authorId: contactId, authorType: "customer", content: data.description, createdAt: now },
        { id: Utils.generateId("m"), authorId: "system", authorType: "system", content: "Escalated to human agent by AI bot.", createdAt: now },
      ],
      history: [
        { id: Utils.generateId("h"), action: "created", actorId: "ai-bot", at: now },
        { id: Utils.generateId("h"), action: "ai-escalated", actorId: "ai-bot", at: now },
      ],
    };

    if (window.Data?.addTicket) Data.addTicket(ticket);
    return ticket;
  },

  generateSubjectFromConversation(conversation) {
    const first = conversation.find(m => m.role === "user");
    if (!first) return "AI escalation – general query";
    const t = first.text.trim();
    return t.length > 80 ? t.slice(0, 80) + "…" : t;
  },
};

window.Escalate = Escalate;