/**
 * Agent workload widget — name + progress bar + count.
 */
const WorkloadWidget = {
  render(hostId) {
    const host = document.getElementById(hostId);
    if (!host) return;
    const agents = Data.getAgents();
    host.innerHTML = agents.map(a => {
      const pct = Math.min(100, (a.workload / a.maxLoad) * 100);
      const color = a.onLeave ? "bg-zinc-300" : pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
      return `
        <div class="flex items-center gap-3 ${a.onLeave ? "opacity-60" : ""}">
          <img src="assets/avatars/${a.avatar}" class="w-7 h-7 rounded-full bg-slate-200" alt="" onerror="this.src='assets/avatars/default.svg'">
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-slate-700 dark:text-slate-300 truncate">${Utils.escapeHtml(a.name)}</span>
              <span class="text-slate-500">${a.workload}/${a.maxLoad}${a.onLeave ? " · leave" : ""}</span>
            </div>
            <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div class="${color} h-full rounded-full transition-all" style="width:${pct}%"></div>
            </div>
          </div>
        </div>`;
    }).join("");
  },
};