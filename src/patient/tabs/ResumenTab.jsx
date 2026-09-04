import React, { useState } from "react";
import { T } from "../../theme.js";
import { fmtDate } from "../../lib/format.js";
import { Card, Field, Btn } from "../../ui/index.js";

function ResumenTab({ child, objectives, sessions, users, onRenewPackage, onCloseProcess, currentUser }) {
  const PAQUETE = 8;
  const childObjectives = objectives.filter((o) => o.childId === child.id);
  const childSessions = sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  const totalSessions = childSessions.length;
  const last = childSessions[0];
  const lastSpecialist = last && users.find((u) => u.id === last.specialistId);
  const lastObjective = last && objectives.find((o) => o.id === last.objectivesWorked[0]?.objectiveId);

  // Package progress: count sessions since packageStart
  const packageStart = child.packageStart || null;
  const packageNum = child.packageNum || 1;
  const sessionsInPackage = packageStart
    ? childSessions.filter((s) => s.date >= packageStart).length
    : totalSessions;
  const enPaquete = sessionsInPackage % PAQUETE || (sessionsInPackage > 0 && sessionsInPackage % PAQUETE === 0 ? PAQUETE : sessionsInPackage % PAQUETE);
  const currentInPackage = sessionsInPackage > 0 ? ((sessionsInPackage - 1) % PAQUETE) + 1 : 0;
  const pct = (currentInPackage / PAQUETE) * 100;
  const barColor = currentInPackage >= 7 ? "#E53935" : currentInPackage >= 5 ? T.amberDeep : currentInPackage >= 3 ? T.amber : "#81C784";
  const [confirmRenew, setConfirmRenew] = useState(false);
  const [showCloseProcess, setShowCloseProcess] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  return (
    <div>
      {/* Sessions by specialty */}
      {totalSessions > 0 && (() => {
        const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
        const bySpec = {};
        childSessions.forEach(s => {
          const spec = users.find(u => u.id === s.specialistId);
          const area = s.specialty || spec?.specialty || "General";
          if (!bySpec[area]) bySpec[area] = 0;
          bySpec[area]++;
        });
        const specList = Object.entries(bySpec).sort((a,b) => b[1]-a[1]);
        return (
          <Card style={{ marginBottom: 22, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Sesiones</div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {specList.map(([area, count]) => {
                    const color = AREA_COLORS[area] || T.inkSoft;
                    return (
                      <div key={area} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ fontFamily: T.font, fontSize: 26, fontWeight: 500, color }}>{count}</div>
                        <div style={{ fontSize: 11.5, color, fontWeight: 600 }}>{area}</div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 20, borderLeft: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: T.font, fontSize: 26, fontWeight: 500, color: T.inkSoft }}>{totalSessions}</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 600 }}>Total</div>
                  </div>
                </div>
              </div>
              {onCloseProcess && (
                <Btn variant="danger" onClick={() => setShowCloseProcess(true)}>Cerrar proceso</Btn>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Cerrar proceso modal */}
      {showCloseProcess && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:20, padding:"32px", maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily:T.fontDisplay, fontSize:22, fontWeight:500, color:T.ink, marginBottom:6 }}>
              Objetivos Alcanzados 🎓
            </div>
            <div style={{ fontSize:13.5, color:T.inkSoft, marginBottom:20 }}>
              {child.name} {child.lastName} · {totalSessions} sesiones
            </div>

            {childObjectives.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Objetivos trabajados</div>
                {childObjectives.map((o) => (
                  <div key={o.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.borderSoft}` }}>
                    <span style={{ fontSize:16 }}>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                    <span style={{ fontSize:13, color: o.status === "logrado" ? "#2E7D32" : T.ink, fontWeight: o.status === "logrado" ? 600 : 400 }}>{o.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Nota de cierre</div>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Describe los logros alcanzados, recomendaciones y motivo de cierre del proceso..."
                rows={4}
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:13.5, fontFamily:T.font, outline:"none", resize:"vertical", boxSizing:"border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.brand}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => { setShowCloseProcess(false); setCloseNote(""); }} style={{ padding:"10px 18px", borderRadius:10, border:`1px solid ${T.border}`, background:"#fff", color:T.inkSoft, fontSize:14, fontFamily:T.font, cursor:"pointer" }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onCloseProcess) onCloseProcess(child.id, closeNote, childObjectives, totalSessions);
                  setShowCloseProcess(false);
                  setCloseNote("");
                }}
                style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#4CAF50", color:"#fff", fontSize:14, fontWeight:600, fontFamily:T.font, cursor:"pointer" }}
              >
                Generar Reporte de Logros
              </button>
            </div>
          </div>
        </div>
      )}

      {last ? (
        <Card style={{ padding: 18, marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Última sesión</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Field label="Fecha" value={fmtDate(last.date)} />
            <Field label="Especialista" value={lastSpecialist?.name || "—"} />
            <Field label="Último objetivo" value={lastObjective?.name || "—"} />
          </div>
        </Card>
      ) : (
        <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 30 }}>Aún no hay sesiones registradas.</div>
      )}
    </div>
  );
}

export default ResumenTab;
