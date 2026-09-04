import React, { useState } from "react";
import { ChevronRight, Plus, Clock, AlertTriangle, TrendingUp, Users, User, Calendar } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { sessionsSinceLastParentReport } from "../lib/reports.js";
import { ROLES } from "../permissions.js";
import { Avatar, Btn, Card, Eyebrow, List, ListRow, StatStrip } from "../ui/index.js";
import CalendarAgenda from "./CalendarAgenda.jsx";
import { useDataStore } from "../store/dataStore.js";
import { useCalendarStore } from "../store/calendarStore.js";
import { useAuthStore } from "../store/authStore.js";

function AdminDashboard({ onOpenChild, onCalendarDateChange, onConnectGcal }) {
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const objectives = useDataStore((s) => s.objectives);
  const parentReports = useDataStore((s) => s.parentReports);
  const activityLog = useDataStore((s) => s.activityLog);
  const calendarEvents = useCalendarStore((s) => s.events);
  const calendarLoading = useCalendarStore((s) => s.loading);
  const calendarError = useCalendarStore((s) => s.error);
  const calendarDate = useCalendarStore((s) => s.date);
  const onMarkSeen = useDataStore((s) => s.markActivitySeen);
  const currentUser = useAuthStore((s) => s.currentUser);
  const onAddChild = useDataStore((s) => s.addChild);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const specialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const today = TODAY;
  const sessionsToday = sessions.filter((s) => s.date === today).length;
  const childrenNoRecentSession = children.filter((c) => {
    const last = sessions.filter((s) => s.childId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last) return true;
    const daysDiff = (new Date(today) - new Date(last.date)) / 86400000;
    return daysDiff > 7;
  });
  const scheduledToday = children
    .filter((c) => c.nextSession === today)
    .sort((a, b) => (a.nextSessionTime || "").localeCompare(b.nextSessionTime || ""));

  // Sesiones del mes en curso frente al anterior. Es la unica cifra del panel
  // con tendencia: las otras tres son conteos puntuales y un porcentaje ahi
  // seria inventado.
  const { sesionesMes, deltaMes } = React.useMemo(() => {
    const hoy = new Date(TODAY);
    const clave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const esteMes = clave(hoy);
    const anterior = clave(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
    const cuenta = (k) => sessions.filter((s) => (s.date || "").slice(0, 7) === k).length;
    const actual = cuenta(esteMes);
    const previo = cuenta(anterior);
    const delta = previo === 0 ? null : Math.round(((actual - previo) / previo) * 100);
    return { sesionesMes: actual, deltaMes: delta };
  }, [sessions]);


  const childrenReadyForParentReport = children.filter((c) => {
    const sinceLast = sessionsSinceLastParentReport(c.id, sessions, parentReports);
    return sinceLast.length >= 8;
  });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
          Panel administrativo
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14.5, marginTop: 5 }}>
          Vista general de AIRA Learning Hub
        </div>
      </div>

      <StatStrip items={[
        { label: "Pacientes activos", value: children.length, icon: Users, tone: "brand" },
        { label: "Especialistas", value: specialists.length, icon: User, tone: "cyan" },
        { label: "Sesiones hoy", value: scheduledToday.length, icon: Calendar, tone: "violet" },
        {
          label: "Sesiones este mes", value: sesionesMes, icon: TrendingUp, tone: "ok",
          delta: deltaMes, deltaLabel: "vs. mes anterior",
        },
      ]} />

      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={children} onOpenChild={onOpenChild} onConnectGcal={onConnectGcal}
      />

      {sessions.length > 0 && (childrenNoRecentSession.length > 0 || childrenReadyForParentReport.length > 0) && (
        <Card style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
          <button
            onClick={() => setAlertsOpen((a) => !a)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 9,
              padding: "14px 18px", background: "none", border: "none",
              cursor: "pointer", fontFamily: T.font, textAlign: "left",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 7, background: T.apoyoTint,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <AlertTriangle size={14} color={T.apoyo} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Requieren atención</span>
            <span style={{
              fontSize: 11.5, fontWeight: 600, background: T.apoyoTint, color: T.apoyo,
              borderRadius: 999, padding: "2px 8px",
            }}>
              {childrenNoRecentSession.length + childrenReadyForParentReport.length}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.inkFaint }}>
              {alertsOpen ? "Ocultar" : "Ver"}
            </span>
          </button>

          {alertsOpen && (
            <List variant="lineas" style={{ borderTop: `1px solid ${T.borderSoft}`, maxHeight: 260, overflowY: "auto" }}>
              {[
                { lista: childrenNoRecentSession, texto: "Sin sesiones en 7 días", tono: T.apoyo, fondo: T.apoyoTint },
                { lista: childrenReadyForParentReport, texto: "Listo para reporte a padres", tono: T.proceso, fondo: T.procesoTint },
              ].flatMap(({ lista, texto, tono, fondo }) => lista.map((c) => (
                <ListRow key={texto + c.id} onClick={() => onOpenChild(c.id)}>
                  <Avatar name={`${c.name} ${c.lastName}`} bg={c.avatarBg} size={26} />
                  <span style={{ fontSize: 13.5, color: T.ink, flex: 1 }}>
                    {c.name} {c.lastName}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: tono, background: fondo,
                    borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap",
                  }}>
                    {texto}
                  </span>
                </ListRow>
              )))}
            </List>
          )}
        </Card>
      )}

      {scheduledToday.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Eyebrow>Agenda de hoy</Eyebrow>
          <Card style={{ padding: 6 }}>
            {scheduledToday.map((c, i) => {
              const specs = c.assignedSpecialists.map((id) => users.find((u) => u.id === id)?.name.split(" ")[0]).join(", ");
              return (
                <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                  border: "none", borderTop: i > 0 ? `1px solid ${T.border}` : "none", background: "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.name} {c.lastName}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{specs}</div>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: T.brand }}>
                    <Clock size={12} /> {c.nextSessionTime || "Sin horario"}
                  </span>
                </button>
              );
            })}
          </Card>
        </div>
      )}

      {/* El listado de pacientes y el de especialistas vivian aqui duplicados.
          Ahora cada uno tiene su pantalla: /pacientes y /especialistas. El panel
          se queda con lo que solo tiene sentido de un vistazo: cifras, agenda y
          lo que requiere atencion. */}

      {showAddPatient && onAddChild && (
        <AddPatientWizard
          users={users}
          currentUser={currentUser}
          onClose={() => setShowAddPatient(false)}
          onCreate={(child, anamnesisDoc) => {
            onAddChild(child, anamnesisDoc);
            setShowAddPatient(false);
            onOpenChild(child.id);
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
