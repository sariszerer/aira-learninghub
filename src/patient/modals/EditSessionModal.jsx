import React, { useState } from "react";
import { T } from "../../theme.js";
import { fmtDate } from "../../lib/format.js";
import { Btn, Modal, ModalHeader, Field } from "../../ui/index.js";

function EditSessionModal({ session, objectives, users, onClose, onSave }) {
  const specialist = users.find(u => u.id === session.specialistId);
  const objs = (session.objectivesWorked || []).map(ow => {
    const obj = objectives.find(o => o.id === ow.objectiveId);
    return obj ? { ...ow, name: obj.name } : null;
  }).filter(Boolean);
  const [observation, setObservation] = useState(session.observation || "");
  const [nextSteps, setNextSteps] = useState(session.nextSteps || "");
  const activities = Array.isArray(session.activities) ? session.activities : [];

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHeader title="Editar registro de sesión" onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Fixed fields - read only */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "14px 16px", background: T.surfaceSunk, borderRadius: 10 }}>
          <Field label="Fecha" value={fmtDate(session.date)} />
          <Field label="Especialista" value={specialist?.name || "—"} />
          <Field label="Especialidad" value={session.specialty || "—"} />
          <Field label="Duración" value={session.duration ? `${session.duration} min` : "—"} />
        </div>
        {objs.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objetivos trabajados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {objs.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 20, fontSize: 13 }}>
                  <span>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                  <span style={{ color: T.ink }}>{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activities.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Actividades realizadas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {activities.map((a, i) => (
                <div key={i} style={{ padding: "4px 10px", background: T.amberTint, color: T.amberDeep, borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{a}</div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Observaciones clínicas</div>
          <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={5}
            placeholder="Observaciones de la sesión, evolución del paciente..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.brand}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recomendaciones para casa / escuela</div>
          <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={3}
            placeholder="Recomendaciones para el hogar o para el equipo escolar..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.brand}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={() => { onSave({ ...session, observation, nextSteps }); onClose(); }}>Guardar</Btn>
      </div>
    </Modal>
  );
}

export default EditSessionModal;
