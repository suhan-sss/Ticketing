/**
 * SLA countdown indicator with color logic + pulse when breached.
 */
const SLAIndicator = {
  render(ticket) {
    const hoursLeft = Utils.getHoursLeft(ticket);
    const color = Utils.getSLAColor(hoursLeft);
    const colorMap = {
      green:  { text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
      yellow: { text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500" },
      red:    { text: "text-rose-700 dark:text-rose-400",       dot: "bg-rose-500"   },
    };
    const c = colorMap[color];
    const label = hoursLeft <= 0
      ? "Breached"
      : hoursLeft < 1
        ? `${Math.round(hoursLeft * 60)}m left`
        : `${hoursLeft.toFixed(1)}h left`;
    const pulse = color === "red" ? "animate-pulse-fast" : "";
    return `<span class="inline-flex items-center gap-1.5 text-xs font-medium ${c.text}">
      <span class="w-2 h-2 rounded-full ${c.dot} ${pulse}"></span>${label}
    </span>`;
  },
};