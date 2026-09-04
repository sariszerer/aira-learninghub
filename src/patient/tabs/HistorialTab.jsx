import React, { useState } from "react";
import { T } from "../../theme.js";
import { fmtDateShort } from "../../lib/format.js";
import { can } from "../../permissions.js";
import { Btn, Card } from "../../ui/index.js";
import EditSessionModal from "../modals/EditSessionModal.jsx";

function HistorialTab({ child, sessions, objectives, users, onViewReport, onUpdateSession, currentUser }) {
  const childSessions = sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  const [editingSession, setEditingSession] = useState(null);

  if (childSessions.length === 0) {
    return <div style={{ color: T.inkFaint, fontSize: 14, textAlign: "center", padding: 40 }}>Aún no hay sesiones registradas para este paciente.</div>;
  }

  const canEdit = (s) => can(currentUser, "session:edit", s);
  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Psicologia Clinica":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};

  return (
    <>
      {editingSession && (
        <EditSessionModal
          session={editingSession}
          objectives={objectives}
          users={users}
          onClose={() => setEditingSession(null)}
          onSave={(updated) => { if (onUpdateSession) onUpdateSession(updated); setEditingSession(null); }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {childSessions.map((s) => {
          const specialist = users.find((u) => u.id === s.specialistId);
          const objs = (s.objectivesWorked || []).map((ow) => objectives.find((o) => o.id === ow.objectiveId)?.name).filter(Boolean);
          const color = AREA_COLORS[s.specialty] || T.inkSoft;
          const activities = Array.isArray(s.activities) ? s.activities : [];
          return (
            <Card key={s.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep, letterSpacing: "0.04em" }}>{fmtDateShort(s.date)}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{s.specialty}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>{specialist?.name.split(" ")[0]}</div>
                    {s.duration && <div style={{ fontSize: 11, color: T.inkFaint }}>{s.duration} min</div>}
                  </div>
                  {objs.length > 0 && (
                    <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Objetivos: </span>{objs.join(" · ")}
                    </div>
                  )}
                  {activities.length > 0 && (
                    <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Actividades: </span>{activities.join(" · ")}
                    </div>
                  )}
                  {s.observation && <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{s.observation}</div>}
                  {s.nextSteps && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4, }}>→ {s.nextSteps}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {canEdit(s) && <Btn variant="ghost" size="sm" onClick={() => setEditingSession(s)}>Editar</Btn>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default HistorialTab;
