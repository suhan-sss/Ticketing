/**
 * Agent dropdown with workload counts and on-leave disabling.
 * Usage: AgentDropdown.render('agent-select', selectedId, { onChange })
 */
const AgentDropdown = {
  render(selectId, selectedId = null, opts = {}) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const agents = Data.getAgents();
    sel.innerHTML = `<option value="">Unassigned</option>` + agents.map(a => {
      const onLeave = a.onLeave ? " (on leave)" : "";
      const full = a.workload >= a.maxLoad ? " — full" : "";
      return `<option value="${a.id}" ${a.id === selectedId ? "selected" : ""} ${a.onLeave || a.workload >= a.maxLoad ? "disabled" : ""}>
        ${Utils.escapeHtml(a.name)} (${a.workload}/${a.maxLoad})${onLeave}${full}
      </option>`;
    }).join("");
    if (opts.onChange) sel.addEventListener("change", e => opts.onChange(e.target.value));
  },
};