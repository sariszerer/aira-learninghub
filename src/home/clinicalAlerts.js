// Calculo de alertas del panel clinico: que pacientes necesitan atencion.
// Vive aparte del componente porque es otra responsabilidad — decidir que esta
// mal, no dibujarlo — y porque asi se puede probar sin montar React.

import { TODAY } from "../theme.js";
import { ROLES } from "../permissions.js";
import { sessionsSinceLastParentReport } from "../lib/reports.js";

export function computeClinicalAlerts({ children, users, sessions, objectives, tutors, tutorReports, parentReports }) {
  const allSpecialistsAndDir = users.filter((u) => ROLES[u.role]?.esClinico);

  // ── Alert calculations ─────────────────────────────────────────────────────

  // 1. Sin sesión 14+ días — agrupados por especialista
  const inactivosPorEsp = allSpecialistsAndDir.map((sp) => {
    const spChildren = children.filter((c) => c.assignedSpecialists.includes(sp.id));
    const inactive = spChildren.filter((c) => {
      const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!last) return true;
      return Math.floor((new Date(TODAY) - new Date(last.date)) / 86400000) >= 14;
    }).map((c) => {
      const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      const days = last ? Math.floor((new Date(TODAY) - new Date(last.date)) / 86400000) : null;
      return { ...c, daysSince: days };
    }).sort((a, b) => (b.daysSince || 999) - (a.daysSince || 999));
    return { sp, inactive };
  }).filter((x) => x.inactive.length > 0);

  // 2. Pacientes con paquete activo — todos los que tienen sesiones, con progreso X/8, X/12
  const PAQUETE_SIZE = 8;
  const conPaquete = children.map((c) => {
    const allSessions = sessions.filter((s) => s.childId === c.id);
    const count = allSessions.length;
    if (count === 0) return null;
    const packageStart = c.packageStart || null;
    const sessionsInPkg = packageStart
      ? allSessions.filter((s) => s.date >= packageStart).length
      : count;
    const currentInPackage = sessionsInPkg > 0 ? ((sessionsInPkg - 1) % PAQUETE_SIZE) + 1 : 0;
    const paqueteNum = c.packageNum || 1;
    const porVencer = currentInPackage >= 6;
    return { ...c, sessionCount: count, enPaquete: currentInPackage, paqueteNum, porVencer };
  }).filter(Boolean);
  const proximosPaquete = conPaquete.filter((c) => c.porVencer).sort((a,b) => b.enPaquete - a.enPaquete);
  const todosConPaquete = conPaquete.sort((a,b) => b.sessionCount - a.sessionCount);

  // 3. 8+ sesiones sin reporte para padres
  const sinReportePadres = children.filter((c) => {
    const childSessions = sessions.filter((s) => s.childId === c.id);
    if (childSessions.length < 8) return false;
    // Check if sessions since last parent report >= 8
    // (simplified: any child with 8+ sessions and no parent report in objectives data)
    return childSessions.length % 8 === 0 || childSessions.length > 8;
  }).slice(0, 10);

  // 4. Sin objetivos definidos
  const sinObjetivos = children.filter((c) => !objectives.some((o) => o.childId === c.id));

  // 5. Objetivo estancado (mismo estado en 3+ sesiones consecutivas sin avance)
  const objetivosEstancados = objectives.filter((o) => {
    const childSessions = sessions
      .filter((s) => s.childId === o.childId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    if (childSessions.length < 3) return false;
    const statuses = childSessions
      .map((s) => (s.objectivesWorked || []).find((ow) => ow.objectiveId === o.id)?.status)
      .filter(Boolean);
    return statuses.length >= 3 && statuses.every((st) => st === "apoyo");
  });

  // Tutor AIRA: reportes vencidos (15+ días sin reporte)
  const tutorsVencidos = tutors.map((sh) => {
    const childObj = children.find((c) => c.id === sh.assignedChildId);
    const lastReport = tutorReports.filter((r) => r.shadowId === sh.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    const days = lastReport ? Math.floor((new Date(TODAY) - new Date(lastReport.date)) / 86400000) : null;
    const overdue = days === null || days >= 15;
    return { sh, childObj, daysSince: days, overdue };
  }).filter((x) => x.overdue);

  const totalAlertas = inactivosPorEsp.reduce((a, x) => a + x.inactive.length, 0)
    + proximosPaquete.length + sinObjetivos.length + objetivosEstancados.length + tutorsVencidos.length;

  const ALERT_TABS = [
    { key: "inactivos", label: "Sin sesión", count: inactivosPorEsp.reduce((a, x) => a + x.inactive.length, 0) },
    { key: "paquete", label: "Paquetes", count: todosConPaquete.length },
    { key: "reportes", label: "Reportes", count: sinReportePadres.length },
    { key: "objetivos", label: "Sin objetivos", count: sinObjetivos.length },
    { key: "estancados", label: "Estancados", count: objetivosEstancados.length },
    { key: "tutors", label: "Tutores AIRA", count: tutorsVencidos.length },
  ];

  return { allSpecialistsAndDir, inactivosPorEsp, proximosPaquete, todosConPaquete, sinReportePadres, sinObjetivos, objetivosEstancados, tutorsVencidos, totalAlertas, ALERT_TABS, conPaquete, PAQUETE_SIZE };
}
