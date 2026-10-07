/**
 * Global Application Configuration
 * Loaded on every page before any other script.
 */
const APP = {
  name: "TicketDesk",
  apiBase: "/api",
  version: "1.0.0",

  // SLA hours per priority
  slaDefaults: {
    LOW: 24,
    MEDIUM: 8,
    HIGH: 4,
    URGENT: 1,
  },

  // Tailwind color names per priority
  priorityColors: {
    LOW: "emerald",
    MEDIUM: "yellow",
    HIGH: "orange",
    URGENT: "red",
  },

  // Tailwind color names per status
  statusColors: {
    OPEN: "blue",
    IN_PROGRESS: "amber",
    WAITING: "purple",
    RESOLVED: "green",
    CLOSED: "zinc",
  },

  // Channel icons/colors
  channelColors: {
    email: "sky",
    chat: "violet",
    phone: "emerald",
    webform: "amber",
  },

  // Pagination
  pageSize: 8,

  // Storage keys
  storageKeys: {
    token: "td_token",
    user: "td_user",
    theme: "td_theme",
  },
};