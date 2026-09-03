import React, { useState } from "react";
import { ChevronRight, Plus, Clock, AlertTriangle } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { sessionsSinceLastParentReport } from "../lib/reports.js";
import { ROLES } from "../permissions.js";
import { Eyebrow, Avatar, Btn, Card, StatStrip } from "../ui/index.js";
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

  const childrenReadyForParentReport = children.filter((c) => {
    const sinceLast = sessionsSinceLastParentReport(c.id, sessions, parentReports);
    return sinceLast.length >= 8;
  });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
          Panel administrativo
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14.5, marginTop: 5 }}>
          Vista general de AIRA Learning Hub
        </div>
      </div>

      <StatStrip items={[
        { label: "Pacientes activos", value: children.length },
        { label: "Especialistas", value: specialists.length },
        { label: "Sesiones hoy", value: scheduledToday.length },
        { label: "Sesiones registradas", value: sessions.length },
      ]} />

      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={children} onOpenChild={onOpenChild} onConnectGcal={onConnectGcal}
      />

      {sessions.length > 0 && (childrenNoRecentSession.length > 0 || childrenReadyForParentReport.length > 0) && (
        <Card style={{ padding: 18, marginBottom: 28, borderColor: T.apoyoTint, background: T.apoyoTint }}>
          <button onClick={() => setAlertsOpen(a => !a)} style={{ display: "flex", alignItems: "center", gap: 8, color: T.apoyo, fontWeight: 700, fontSize: 13.5, marginBottom: alertsOpen ? 10 : 0, background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
            <AlertTriangle size={16} />
            Alertas
            <span style={{ fontSize: 12, background: T.apoyo, color: "#fff", borderRadius: 10, padding: "1px 7px", marginLeft: 2 }}>{childrenNoRecentSession.length + childrenReadyForParentReport.length}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.apoyo }}>{alertsOpen ? "▲ Minimizar" : "▼ Ver"}</span>
          </button>
          {alertsOpen && (
            <div style={{ fontSize: 14, color: T.ink }}>
              {childrenNoRecentSession.map((c) => (
                <div key={c.id} style={{ padding: "6px 0" }}>
                  <b>{c.name} {c.lastName}</b> no tiene sesiones registradas en los últimos 7 días.
                </div>
              ))}
              {childrenReadyForParentReport.map((c) => (
                <div key={c.id} style={{ padding: "6px 0" }}>
                  <b>{c.name} {c.lastName}</b> acumuló 8 sesiones desde el último reporte a padres — listo para generar uno nuevo.
                </div>
              ))}
            </div>
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

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow style={{ margin: 0 }}>Todos los pacientes</Eyebrow>
            {onAddChild && (
              <Btn variant="amber" size="sm" icon={Plus} onClick={() => setShowAddPatient(true)}>Agregar paciente</Btn>
            )}
          </div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="text" placeholder="Buscar paciente..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box", color: T.ink, background: "#fff" }}
              onFocus={(e) => e.target.style.borderColor = T.brand}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.inkFaint, fontSize: 15, pointerEvents: "none" }}>🔍</span>
          </div>
          <Card style={{ padding: 6 }}>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q ? children.filter(c =>
                (c.name + " " + c.lastName).toLowerCase().includes(q) ||
                c.lastName.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q)
              ) : children;
              if (filtered.length === 0) return <div style={{ padding: "16px 12px", color: T.inkFaint, fontSize: 13.5 }}>Sin resultados para "{searchQuery}"</div>;
              return filtered.map((c, i) => {
                const specs = c.assignedSpecialists.map((id) => users.find((u) => u.id === id)?.name.split(" ")[0]).join(", ");
                return (
                  <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                    border: "none", borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none", background: "transparent",
                    cursor: "pointer", textAlign: "left",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{c.name} {c.lastName}</div>
                      <div style={{ fontSize: 12, color: T.inkFaint }}>{specs}</div>
                    </div>
                    <ChevronRight size={16} color={T.inkFaint} />
                  </button>
                );
              });
            })()}
          </Card>
        </div>
        <div>
          <Eyebrow>Especialistas</Eyebrow>
          <Card style={{ padding: 6 }}>
            {specialists.map((u, i) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none",
              }}>
                <Avatar name={u.name} bg={u.avatarBg} size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: T.inkFaint }}>{u.specialty}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

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
