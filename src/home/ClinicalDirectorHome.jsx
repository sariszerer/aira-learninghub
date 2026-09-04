import React, { useState } from "react";
import { Search, X, Check } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { ROLES } from "../permissions.js";
import { Eyebrow, Card } from "../ui/index.js";
import CalendarAgenda from "./CalendarAgenda.jsx";
import ChildCard from "./ChildCard.jsx";
import { computeClinicalAlerts } from "./clinicalAlerts.js";
import ActivityFeed from "./ActivityFeed.jsx";
import { useDataStore } from "../store/dataStore.js";
import { useCalendarStore } from "../store/calendarStore.js";

function ClinicalDirectorHome({ user, onOpenChild, onCalendarDateChange, onConnectGcal }) {
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const objectives = useDataStore((s) => s.objectives);
  const tutors = useDataStore((s) => s.tutors);
  const tutorReports = useDataStore((s) => s.tutorReports);
  const activityLog = useDataStore((s) => s.activityLog);
  const calendarEvents = useCalendarStore((s) => s.events);
  const calendarLoading = useCalendarStore((s) => s.loading);
  const calendarError = useCalendarStore((s) => s.error);
  const calendarDate = useCalendarStore((s) => s.date);
  const onMarkSeen = useDataStore((s) => s.markActivitySeen);
  const [query, setQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("Todos");
  const [alertTab, setAlertTab] = useState("inactivos");

  const allSpecialties = ["Todos", ...Array.from(new Set(children.flatMap((c) => c.specialties))).sort()];
  const filtered = children.filter((c) => {
    const matchQ = (c.name + " " + c.lastName).toLowerCase().includes(query.toLowerCase());
    const matchS = filterSpecialty === "Todos" || c.specialties.includes(filterSpecialty);
    return matchQ && matchS;
  });

  const misPacientesAsignados = children.filter((c) => c.assignedSpecialists.includes(user.id));
  const myToday = misPacientesAsignados.filter((c) => c.nextSession === TODAY)
    .sort((a, b) => (a.nextSessionTime || "").localeCompare(b.nextSessionTime || ""));

  const { allSpecialistsAndDir, inactivosPorEsp, proximosPaquete, todosConPaquete, sinReportePadres, sinObjetivos, objetivosEstancados, tutorsVencidos, totalAlertas, ALERT_TABS, conPaquete, PAQUETE_SIZE } =
    computeClinicalAlerts({ children, users, sessions, objectives, tutors, tutorReports, parentReports });

  // ── Shared mini row ────────────────────────────────────────────────────────
  const AlertRow = ({ child, sub, subColor }) => (
    <div onClick={() => onOpenChild(child.id)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer", borderTop: `1px solid ${T.borderSoft}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: child.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {child.name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{child.name} {child.lastName}</div>
        {sub && <div style={{ fontSize: 11.5, color: subColor || T.amberDeep }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 20px 60px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
          Hola, {user.name.split(" ")[0]}
        </div>
        <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: `${T.brandBright}22`, color: T.brandBright, fontSize: 11.5, fontWeight: 600,
            padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase",
          }}>Directora Clínica</span>
          <span style={{ color: T.borderSoft }}>·</span>
          <span>{user.specialty}</span>
        </div>
      </div>

      {/* Stat strip */}
      <Card style={{ padding: 0, marginBottom: 28, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { label: "Pacientes activos", value: children.length, sub: `${allSpecialistsAndDir.length} especialistas`, tab: null },
            { label: "Sesiones este mes", value: sessions.filter(s => s.date && s.date.slice(0,7) === TODAY.slice(0,7)).length, sub: `${sessions.length} en total`, tab: null },
            { label: "Inactivos +14 días", value: inactivosPorEsp.reduce((a,x)=>a+x.inactive.length,0), warn: inactivosPorEsp.reduce((a,x)=>a+x.inactive.length,0)>0, tab: "inactivos" },
            { label: "Paquetes por vencer", value: proximosPaquete.length, warn: proximosPaquete.length>0, tab: "paquete" },
            { label: "Sin objetivos", value: sinObjetivos.length, warn: sinObjetivos.length>0, tab: "objetivos" },
          ].map((it, i) => (
            <div key={it.label}
              onClick={it.tab ? () => setAlertTab(it.tab) : undefined}
              style={{
                padding: "18px 20px", cursor: it.tab ? "pointer" : "default",
                borderLeft: i > 0 ? `1px solid ${T.borderSoft}` : "none",
                background: it.warn ? `${T.amber}10` : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={it.tab ? (e) => { e.currentTarget.style.background = it.warn ? `${T.amber}20` : T.surfaceSunk; } : undefined}
              onMouseLeave={it.tab ? (e) => { e.currentTarget.style.background = it.warn ? `${T.amber}10` : "transparent"; } : undefined}
            >
              <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: it.warn ? T.amberDeep : T.ink, lineHeight: 1 }}>{it.value}</div>
              <div style={{ fontSize: 12, color: it.warn ? T.amberDeep : T.inkSoft, marginTop: 5, fontWeight: it.warn ? 600 : 400 }}>{it.label}</div>
              {it.sub && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{it.sub}</div>}
              {it.tab && it.value > 0 && <div style={{ fontSize: 10.5, color: T.brand, marginTop: 4, fontWeight: 600 }}>Ver alertas →</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Live calendar */}
      <CalendarAgenda
        events={calendarEvents} loading={calendarLoading} error={calendarError}
        date={calendarDate} onDateChange={onCalendarDateChange}
        children={children} onOpenChild={onOpenChild} onConnectGcal={onConnectGcal}
      />
      <ActivityFeed activityLog={activityLog} users={users} onMarkSeen={onMarkSeen} />

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 24, alignItems: "start" }}>

        {/* Left: all patients */}
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: 12, color: T.inkFaint }} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar paciente..."
                style={{
                  width: "100%", padding: "10px 14px 10px 38px", borderRadius: 12,
                  border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font,
                  background: "#fff", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <select
              value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)}
              style={{
                padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                fontSize: 13.5, fontFamily: T.font, background: "#fff",
                color: T.ink, outline: "none", cursor: "pointer",
              }}
            >
              {allSpecialties.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <Eyebrow>Todos los pacientes ({filtered.length})</Eyebrow>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkFaint }}>No se encontraron pacientes.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.map((c) => (
                <ChildCard key={c.id} child={c} users={users} sessions={sessions} onOpen={() => onOpenChild(c.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* My sessions today */}
          {myToday.length > 0 && (
            <Card>
              <Eyebrow style={{ marginBottom: 12 }}>Mis sesiones hoy</Eyebrow>
              {myToday.map((c) => (
                <div key={c.id} onClick={() => onOpenChild(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: c.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{c.name} {c.lastName}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{c.nextSessionTime}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Alertas clínicas con tabs */}
          <Card style={{ }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Eyebrow>Alertas clínicas</Eyebrow>
              <span style={{
                background: T.amberDeep, color: "#fff", fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 20,
              }}>{totalAlertas}</span>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
              {ALERT_TABS.map((t) => (
                <button key={t.key} onClick={() => setAlertTab(t.key)}
                  style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: T.font,
                    background: alertTab === t.key ? T.amberDeep : T.bg,
                    color: alertTab === t.key ? "#fff" : T.inkSoft,
                    outline: "none",
                  }}>
                  {t.label} {t.count > 0 && <span style={{ opacity: 0.8 }}>({t.count})</span>}
                </button>
              ))}
            </div>

            {/* Tab content */}

            {alertTab === "inactivos" && (
              inactivosPorEsp.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos activos</div>
                : inactivosPorEsp.map(({ sp, inactive }) => (
                  <div key={sp.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      {sp.name.split(" ")[0]}
                    </div>
                    {inactive.map((c) => (
                      <AlertRow key={c.id} child={c}
                        sub={c.daysSince !== null ? `Hace ${c.daysSince} días` : "Sin sesiones registradas"} />
                    ))}
                  </div>
                ))
            )}

            {alertTab === "paquete" && (
              <div>
                {proximosPaquete.length > 0 && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.amberDeep, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>⚠ Por vencer</div>
                )}
                {todosConPaquete.length === 0
                  ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Sin paquetes activos</div>
                  : todosConPaquete.map((c) => {
                    const pct = (c.enPaquete / PAQUETE_SIZE) * 100;
                    const barColor = c.enPaquete >= 6 ? T.amberDeep : c.enPaquete >= 4 ? T.amber : "#81C784";
                    return (
                      <div key={c.id} onClick={() => onOpenChild(c.id)}
                        style={{ padding: "9px 0", cursor: "pointer", borderTop: `1px solid ${T.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name} {c.lastName}</div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: barColor }}>{c.enPaquete}/{PAQUETE_SIZE}</div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: T.borderSoft, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 3 }}>
                          Paquete {c.paqueteNum} · {c.sessionCount} sesiones en total
                          {c.enPaquete >= 6 && <span style={{ color: T.amberDeep, fontWeight: 600 }}> — renovar o cerrar</span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {alertTab === "reportes" && (
              sinReportePadres.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Al día</div>
                : sinReportePadres.map((c) => {
                  const count = sessions.filter((s) => s.childId === c.id).length;
                  return (
                    <AlertRow key={c.id} child={c}
                      sub={`${count} sesiones — generar reporte para padres`}
                      subColor="#9A6B9A" />
                  );
                })
            )}

            {alertTab === "objetivos" && (
              sinObjetivos.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos tienen objetivos</div>
                : sinObjetivos.map((c) => (
                  <AlertRow key={c.id} child={c} sub="Sin objetivos definidos" subColor={T.amberDeep} />
                ))
            )}

            {alertTab === "estancados" && (
              objetivosEstancados.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Sin objetivos estancados</div>
                : objetivosEstancados.map((o) => {
                  const child = children.find((c) => c.id === o.childId);
                  if (!child) return null;
                  return (
                    <div key={o.id} onClick={() => onOpenChild(child.id)}
                      style={{ padding: "7px 0", cursor: "pointer", borderTop: `1px solid ${T.borderSoft}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{child.name} {child.lastName}</div>
                      <div style={{ fontSize: 11.5, color: "#B56060" }}>"{o.name}" — sin avance en últimas sesiones</div>
                    </div>
                  );
                })
            )}

            {alertTab === "tutors" && (
              tutorsVencidos.length === 0
                ? <div style={{ fontSize: 13, color: T.inkFaint, padding: "8px 0" }}>✓ Todos los tutors al día</div>
                : tutorsVencidos.map(({ sh, childObj, daysSince }) => (
                  <div key={sh.id} style={{ padding: "8px 0", borderTop: `1px solid ${T.borderSoft}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sh.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{childObj ? `${childObj.name} ${childObj.lastName}` : "—"} · {sh.school}</div>
                    <div style={{ fontSize: 11.5, color: T.amberDeep, marginTop: 2 }}>
                      {daysSince !== null ? `Último reporte hace ${daysSince} días` : "Sin reportes aún"}
                    </div>
                  </div>
                ))
            )}
          </Card>

          {/* Equipo clínico */}
          <Card>
            <Eyebrow style={{ marginBottom: 12 }}>Equipo clínico</Eyebrow>
            {allSpecialistsAndDir.map((sp) => {
              const count = children.filter((c) => c.assignedSpecialists.includes(sp.id)).length;
              return (
                <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: sp.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {sp.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sp.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft }}>{sp.specialty.split("·")[0].trim()}</div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>{count}</div>
                </div>
              );
            })}
          </Card>

        </div>
      </div>
    </div>
  );
}

export default ClinicalDirectorHome;
