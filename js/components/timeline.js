/**
 * Conversation timeline — customer (left), agent (right), system (center).
 */
const Timeline = {
  render(messages) {
    if (!messages.length) {
      return `<div class="text-center text-sm text-slate-500 py-6">No messages yet.</div>`;
    }
    return messages.map(m => {
      if (m.authorType === "system") {
        return `<div class="flex justify-center my-3">
          <span class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">${Utils.escapeHtml(m.content)}</span>
        </div>`;
      }
      const isAgent = m.authorType === "agent";
      const author = isAgent ? Data.getAgent(m.authorId) : Data.getContact(m.authorId);
      const name = author?.name || "Unknown";
      const avatar = isAgent ? `assets/avatars/${author?.avatar || "default.svg"}` : "";
      const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

      return `
        <div class="flex gap-3 ${isAgent ? "flex-row-reverse text-right" : ""}">
          ${avatar
            ? `<img src="${avatar}" alt="" class="w-8 h-8 rounded-full bg-slate-200 shrink-0">`
            : `<div class="w-8 h-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0">${initials}</div>`}
          <div class="max-w-[80%]">
            <div class="text-xs text-slate-500 mb-1">
              <span class="font-medium text-slate-700 dark:text-slate-300">${Utils.escapeHtml(name)}</span>
              <span class="mx-1">·</span>
              <span>${Utils.formatRelativeTime(m.createdAt)}</span>
            </div>
            <div class="inline-block px-3 py-2 rounded-lg text-sm ${isAgent ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"}">
              ${Utils.escapeHtml(m.content)}
            </div>
          </div>
        </div>`;
    }).join("");
  },
};