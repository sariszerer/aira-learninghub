// Composicion de textos de reporte a partir de sesiones y objetivos.

import { fmtDate } from "./format.js";

export function sessionsSinceLastParentReport(childId, sessions, parentReports) {
  const childReports = (parentReports || []).filter((r) => r.childId === childId).sort((a, b) => b.toDate.localeCompare(a.toDate));
  const lastReport = childReports[0];
  const childSessions = sessions.filter((s) => s.childId === childId);
  if (!lastReport) return childSessions;
  return childSessions.filter((s) => s.date > lastReport.toDate);
}

export function buildParentReportText(child, rangeSessions, objectives) {
  const lines = [];
  lines.push(`Reporte de progreso — ${child.name} ${child.lastName}`);
  lines.push(`AIRA Learning Hub`);
  lines.push("");
  lines.push(`Periodo: ${fmtDate(rangeSessions[0]?.date || TODAY)} al ${fmtDate(rangeSessions[rangeSessions.length - 1]?.date || TODAY)}`);
  lines.push(`Sesiones incluidas: ${rangeSessions.length}`);
  lines.push("");

  const objIds = Array.from(new Set(rangeSessions.flatMap((s) => s.objectivesWorked.map((ow) => ow.objectiveId))));
  const objs = objIds.map((id) => objectives.find((o) => o.id === id)).filter(Boolean);
  const logrados = objs.filter((o) => o.status === "logrado");
  const enProceso = objs.filter((o) => o.status === "proceso");

  if (logrados.length) {
    lines.push("Logros de este periodo:");
    logrados.forEach((o) => lines.push(`• ${o.name}`));
    lines.push("");
  }
  if (enProceso.length) {
    lines.push("En proceso, seguimos trabajando en:");
    enProceso.forEach((o) => lines.push(`• ${o.name}`));
    lines.push("");
  }
  const lastNote = [...rangeSessions].reverse().find((s) => s.nextSteps)?.nextSteps;
  if (lastNote) {
    lines.push(`Próximos pasos: ${lastNote}`);
    lines.push("");
  }
  lines.push("Cualquier duda, con gusto la conversamos en la próxima sesión.");
  return lines.join("\n");
}
