import React, { useState } from "react";
import { T, SPECIALIST_COLORS } from "../../theme.js";
import { fmtDateShort } from "../../lib/format.js";
import { can } from "../../permissions.js";
import { Card, Chip, Btn } from "../../ui/index.js";
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
        <Chip label={`Todas (${childSessions.length})`} selected={filterSpec === null} onClick={() => setFilterSpec(null)} />
        {specs.map(sp => {
          // Get the specialist for this specialty to use their color
          const specForColor = childSessions.find(s => s.specialty === sp);
          const color = SPECIALIST_COLORS[specForColor?.specialistId] || AREA_COLORS[sp] || T.inkSoft;
          const count = childSessions.filter(s => s.specialty === sp).length;
          const active = filterSpec === sp;
          return (
            <Chip key={sp} label={`${sp} (${count})`} selected={active} onClick={() => setFilterSpec(active ? null : sp)} />
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
            <Card key={s.id} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{fmtDateShort(s.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{s.specialty}</span>
                    <span style={{ fontSize: 12, color, opacity: 0.8 }}>{specialist?.name?.split(" ")[0]}</span>
                    {s.duration && <span style={{ fontSize: 11, color: T.inkFaint }}>{s.duration} min</span>}
                  </div>
                  {objs.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Objetivos:</b> {objs.join(" · ")}</div>}
                  {acts.length > 0 && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}><b>Actividades:</b> {acts.join(" · ")}</div>}
                  {s.observation && <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{s.observation}</div>}
                  {s.nextSteps && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4, }}>→ {s.nextSteps}</div>}
                </div>
                {canEdit(s) && (
                  <Btn variant="secondary" size="sm" onClick={() => setEditingSession(s)}>Editar</Btn>
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
