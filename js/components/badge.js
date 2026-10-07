/**
 * Badge components: priority, status, channel.
 * Pure functions returning HTML strings.
 */
const Badge = {
  priority(p) {
    const map = {
      LOW:    { cls: "bg-emerald-100 text-emerald-700 ring-emerald-200", label: "Low"    },
      MEDIUM: { cls: "bg-amber-100 text-amber-700 ring-amber-200",       label: "Medium" },
      HIGH:   { cls: "bg-orange-100 text-orange-700 ring-orange-200",    label: "High"   },
      URGENT: { cls: "bg-rose-100 text-rose-700 ring-rose-200",          label: "Urgent" },
    };
    const s = map[p] || map.LOW;
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${s.cls}">${s.label}</span>`;
  },

  status(s) {
    const map = {
      OPEN:        { cls: "bg-blue-100 text-blue-700 ring-blue-200",         label: "Open"        },
      IN_PROGRESS: { cls: "bg-amber-100 text-amber-700 ring-amber-200",       label: "In Progress" },
      WAITING:     { cls: "bg-purple-100 text-purple-700 ring-purple-200",   label: "Waiting"     },
      RESOLVED:    { cls: "bg-emerald-100 text-emerald-700 ring-emerald-200",label: "Resolved"    },
      CLOSED:      { cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",         label: "Closed"      },
    };
    const v = map[s] || map.OPEN;
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${v.cls}">${v.label}</span>`;
  },

  channel(c) {
    const map = {
      email:   { cls: "bg-sky-100 text-sky-700",     icon: "✉" },
      chat:    { cls: "bg-violet-100 text-violet-700",icon: "💬" },
      phone:   { cls: "bg-emerald-100 text-emerald-700", icon: "📞" },
      webform: { cls: "bg-amber-100 text-amber-700", icon: "🌐" },
    };
    const v = map[c] || map.email;
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${v.cls}"><span>${v.icon}</span>${c}</span>`;
  },

  tag(t) {
    const tag = Data.getTag(t);
    if (!tag) return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">${t}</span>`;
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${tag.color}-100 text-${tag.color}-700">${tag.label}</span>`;
  },
};