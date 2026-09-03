import React, { useState } from "react";
import { T, SPECIALIST_COLORS } from "../../theme.js";
import { fmtDateShort } from "../../lib/format.js";
import { can } from "../../permissions.js";
import { Card } from "../../ui/index.js";
import EditSessionModal from "../modals/EditSessionModal.jsx";

function SesionesTab({ child, sessions, objectives, users, currentUser, onUpdateSession }) {
  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Pautas de Crianza":"#C79A6B","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
  const [editingSession, setEditingSession] = useState(null);
  const [filterSpec, setFilterSpec] = useState(null);

  const childSessions = sessions.filter(s => s.childId === child.id).sort((a,b) => b.date.localeCompare(a.date));
  const specs = [...new Set(childSessions.map(s => s.specialty))].filter(Boolean);
  const canEdit = (s) => can(currentUser, "session:edit", s);
  const filtered = filterSpec ? childSessions.filter(s => s.specialty === filterSpec) : childSessions;
  const getSessionColor = (s) => SPECIALIST_COLORS[s.specialistId] || "#888";

  return (
    <div>
      {editingSession && (
        <EditSessionModal
          session={editingSession} objectives={objectives} users={users}
          onClose={() => setEditingSession(null)}
          onSave={(updated) => { if (onUpdateSession) onUpdateSession(updated); setEditingSession(null); }}
        />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setFilterSpec(null)}
          style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${filterSpec === null ? T.ink : T.border}`, background: filterSpec === null ? T.ink : "#fff", color: filterSpec === null ? "#fff" : T.inkSoft, fontSize: 12, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>
          Todas ({childSessions.length})
        </button>
        {specs.map(sp => {
          // Get the specialist for this specialty to use their color
          const specForColor = childSessions.find(s => s.specialty === sp);
          const color = SPECIALIST_COLORS[specForColor?.specialistId] || AREA_COLORS[sp] || T.inkSoft;
          const count = childSessions.filter(s => s.specialty === sp).length;
          const active = filterSpec === sp;
          return (
            <button key={sp} onClick={() => setFilterSpec(active ? null : sp)}
              style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${active ? color : T.border}`, background: active ? color : "#fff", color: active ? "#fff" : color, fontSize: 12, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>
              {sp} ({count})
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(s => {
          const specialist = users.find(u => u.id === s.specialistId);
          const color = getSessionColor(s);
          const objs = (s.objectivesWorked || []).map(ow => objectives.find(o => o.id === ow.objectiveId)?.name).filter(Boolean);
          const acts = Array.isArray(s.activities) ? s.activities : [];
          return (
            <Card key={s.id} style={{ padding: "14px 16px", borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep }}>{fmtDateShort(s.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{s.specialty}</span>
                    <span style={{ fontSize: 12, color, opacity: 0.8 }}>{specialist?.name?.split(" ")[0]}</span>
                    {s.duration && <span style={{ fontSize: 11, color: T.inkFaint }}>{s.duration} min</span>}
                  </div>
                  {objs.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Objetivos:</b> {objs.join(" · ")}</div>}
                  {acts.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Actividades:</b> {acts.join(" · ")}</div>}
                  {s.observation && <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{s.observation}</div>}
                  {s.nextSteps && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4, fontStyle: "italic" }}>→ {s.nextSteps}</div>}
                </div>
                {canEdit(s) && (
                  <button onClick={() => setEditingSession(s)}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: `0.5px solid ${T.border}`, background: "#fff", color: T.inkSoft, cursor: "pointer", fontFamily: T.font, flexShrink: 0 }}>
                    Editar
                  </button>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 32 }}>Sin sesiones registradas.</div>}
      </div>
    </div>
  );
}

export default SesionesTab;
