# TicketDesk — Customer Support Request Management

A complete, framework-free ticketing application built with **HTML + Tailwind CSS + vanilla JavaScript**. Zero build step required for development.

## Features

- **Ticket list** with table + Kanban views, search, multi-filter, pagination
- **Drag-and-drop** between Kanban columns (native HTML5 DnD)
- **Ticket detail** with timeline, reply box, sidebar dropdowns, history log
- **Quick actions** — Resolve, Escalate, Duplicate (with confirm modal)
- **Create ticket** form with validation, auto-SLA, tag chip input, file dropzone
- **Automation rules** with dynamic condition & action builders
- **Agent workload** widget with on-leave / full-capacity handling
- **SLA indicator** with color-coded countdown and pulsing breach state
- **Dark mode** + responsive sidebar
- **Mock data layer** — swap `api.js` internals for real fetch() calls
- **Role-based access** (admin-only Settings page)

## Quick Start (CDN — no build)

1. Open `login.html` in a browser.
2. Sign in with any email/password; choose **Agent** or **Admin** role.
3. Explore the app — all data is in-memory mock data.

## Quick Start (Local Tailwind build)

```bash
npm install
npm run watch    # rebuilds css/tailwind.css on change
```

Then change the `<script src="https://cdn.tailwindcss.com"></script>` lines in HTML to `<link rel="stylesheet" href="css/tailwind.css">`.

## File Structure

```
ticketing/
├── index.html                  Ticket list (Table + Kanban)
├── new.html                    Create ticket form
├── ticket.html                 Ticket detail (?id=)
├── settings.html               Automation rules (admin)
├── login.html                  Login
│
├── css/
│   ├── input.css               Tailwind input (build source)
│   ├── tailwind.css            Compiled output (or use CDN)
│   ├── custom.css              Kanban, sidebar, scrollbar styles
│   └── components.css          Reusable component classes
│
├── js/
│   ├── app.js                  Global init (auth, theme, sidebar)
│   ├── api.js                  Fetch wrapper (currently returns mocks)
│   ├── auth.js                 Login/logout, route guards
│   ├── mock-data.js            Agents, contacts, tickets, rules, tags
│   ├── utils.js                formatRelativeTime, debounce, escapeHtml, …
│   ├── toast.js                Toast notification system
│   ├── sidebar.js              Renders sidebar nav + logout
│   │
│   ├── pages/
│   │   ├── list.js             List page (table, kanban, search, DnD)
│   │   ├── new.js              New ticket form logic
│   │   ├── detail.js           Ticket detail logic
│   │   └── settings.js         Automation rules page
│   │
│   ├── components/
│   │   ├── badge.js            Priority/status/channel/tag badges
│   │   ├── sla-indicator.js    SLA countdown with color logic
│   │   ├── agent-dropdown.js   Agent selector with workload
│   │   ├── tag-input.js        Tag chip input
│   │   ├── modal.js            Open/close + Promise confirm
│   │   ├── timeline.js         Conversation timeline
│   │   ├── kanban.js           Kanban board + drag-and-drop
│   │   ├── table.js            Table with sorting + pagination
│   │   ├── workload-widget.js  Agent workload bars
│   │   └── condition-builder.js Dynamic condition rows
│   │
│   └── templates/
│       └── ticket-card.js      All template literals (card, row, bubble, rule, history, option)
│
├── assets/
│   ├── icons/                  SVG icons (16 files)
│   ├── images/                 login-bg.svg, empty-state.svg
│   └── avatars/                default.svg, agent-{1,2,3}.svg
│
├── config/
│   └── config.js               App name, API base, SLA defaults, colors
│
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Wiring to a Real Backend

`js/api.js` currently returns data from `mock-data.js`. To go live:

1. Replace each `api.get/post/patch/delete` body with a real `fetch()` call.
2. Drop the mock-data script from HTML once the backend is up.
3. Backend routes already mirror the mock URLs: `/tickets`, `/tickets/:id`, `/agents`, `/rules`.

## Tech Notes

- **No framework.** No React, Vue, or build step required.
- **Tailwind via CDN** by default — change one tag per HTML to switch to local build.
- **Dark mode** uses the `class` strategy (Tailwind config).
- **Templates** are JS template literal strings, not HTML files (loaded by `js/templates/ticket-card.js`).
- **Drag-and-drop** is native HTML5 — works without any library.

---

## 🤖 AI Customer Support Layer

A pluggable AI module sits in front of the ticketing app. Customers chat with the AI on any page; if the AI can't resolve the question, it creates a real ticket in your existing system.

### AI flow

```
Customer asks in chat widget
        │
        ▼
   RAG.search()         ← keyword + fuzzy search across knowledge base
        │
        ▼
   LLM.query()          ← sends context + user message to OpenAI / Anthropic / Gemini
        │
        ├─ Confidence ≥ threshold → reply in chat (no ticket)
        │
        └─ Low confidence / "talk to a human" / max attempts reached
              │
              ▼
          Escalate.toTicket()   ← creates a real ticket with full transcript,
                                   AI-suggested priority + tags + confidence
```

### New files

```
ticketing/
├── chat-widget.html              Demo page with the floating chat widget
├── config/
│   └── ai-config.js              Provider, model, API key, thresholds, system prompt
├── js/ai/
│   ├── chatbot.js                Widget UI + message loop + escalation trigger
│   ├── llm.js                    LLM wrapper — OpenAI / Anthropic / Gemini / mock
│   ├── rag.js                    Knowledge base + keyword search
│   └── escalate.js               Builds & inserts ticket via Data.addTicket()
├── knowledge/
│   ├── faqs.json                 5 FAQ entries
│   ├── faq-technical.json        3 technical FAQ entries
│   ├── shipping-policy.txt       Shipping / delivery / refund policy
│   └── refund-policy.txt         Refund / cancellation policy
└── assets/icons/
    ├── ai-sparkle.svg            AI badge icon
    └── chat-bubble.svg           Floating button icon
```

### How to demo

1. Open `chat-widget.html` in a browser (or any page after the AI scripts load — `index.html` and `ticket.html` mount the widget automatically).
2. Click the green floating button (bottom-right).
3. Try a suggested chip ("Order status", "Refund policy", etc.) — AI replies using the knowledge base.
4. Type **"talk to a human"** — AI escalates and creates a real ticket.
5. Open `index.html` — the new ticket appears at the top with a **🤖 AI-Escalated** badge, AI-suggested priority, and the full conversation transcript as the description.
6. Open `settings.html` (admin only) → switch to the **AI Configuration** tab — change provider, model, API key, escalation threshold, knowledge base files, welcome message, and suggested questions.

### Switching to a real LLM

In `config/ai-config.js`, set:
```js
AI_CONFIG.provider = "openai";        // or "anthropic" | "gemini"
AI_CONFIG.apiKey   = "sk-...";        // your key
AI_CONFIG.model    = "gpt-4o-mini";   // or claude-haiku-4-5, gemini-1.5-flash
```

The widget automatically uses live API calls. **Mock mode works with zero keys** for local development.

### Agent assist

On any ticket detail page, click **✨ AI Suggested Reply** — the LLM drafts a 2-3 sentence reply from the ticket context. The agent edits and sends.

AI-escalated tickets show an extra violet panel with:
- Reason for escalation
- Number of AI attempts before giving up
- Pre-suggested draft reply

The sidebar gets an **AI Classification** card with:
- Category (extracted from tags)
- Sentiment (Frustrated / Concerned / Neutral)
- Suggested team to assign
- Confidence bar (green ≥ 0.8, amber ≥ 0.6, red < 0.6)

## Demo Credentials

Any email + password works. Pick **Admin** to access `settings.html`.

— Built as a self-contained demo. Plug your backend in via `api.js` when ready.