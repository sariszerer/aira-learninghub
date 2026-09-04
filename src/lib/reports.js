// Cuando toca el proximo reporte para la familia.
//
// La composicion de los tres reportes vive en lib/reportes.js desde que se
// implemento Formatos_Reportes_AIRA.docx. Aqui queda solo esto, que responden
// dos pantallas distintas: el panel de administracion (a quien le toca) y la
// pestana de reportes del paciente.

export function sessionsSinceLastParentReport(childId, sessions, parentReports) {
  const childReports = (parentReports || []).filter((r) => r.childId === childId).sort((a, b) => b.toDate.localeCompare(a.toDate));
  const lastReport = childReports[0];
  const childSessions = sessions.filter((s) => s.childId === childId);
  if (!lastReport) return childSessions;
  return childSessions.filter((s) => s.date > lastReport.toDate);
}
