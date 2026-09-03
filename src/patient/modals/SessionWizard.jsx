import React, { useState } from "react";
import { inputStyle, TODAY } from "../../theme.js";
import { can } from "../../permissions.js";
import { Btn, Modal, ModalHeader } from "../../ui/index.js";
import { useAuthStore } from "../../store/authStore.js";

function SessionWizard({ child, objectives, onClose, onSave }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [date, setDate] = useState(TODAY);
  const [duration, setDuration] = useState(45);
  const [selectedObjIds, setSelectedObjIds] = useState([]);
  const [customObjText, setCustomObjText] = useState("");
  const [activities, setActivities] = useState("");
  const [observation, setObservation] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  // Only show this specialist's objectives for this child
  const myObjectives = objectives.filter(o => 
    o.childId === child.id && 
    can(currentUser, "objective:edit", o)
  );

  // Session number for this specialist + child
  const toggleObj = (id) => setSelectedObjIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = () => {
    if (!date) return;
    onSave({
      childId: child.id,
      specialistId: currentUser.id,
      specialty: currentUser.specialty,
      date,
      duration,
      objectivesWorked: selectedObjIds.map(id => ({ objectiveId: id, status: "proceso" })),
      activities: activities.split("\n").map(a => a.trim()).filter(Boolean),
      observation: observation.trim(),
      nextSteps: nextSteps.trim(),
    });
  };

  const AREA_COLORS = {"Terapia Ocupacional":"#175FAF","Fonoaudiologia":"#7A9E7E","Funciones Ejecutivas":"#C79A6B","Psicologia":"#A6779A","Desarrollo (DVLP)":"#B8860B","Kids Club":"#82A166"};
  const color = AREA_COLORS[currentUser.specialty] || "#888";

  return (
    <Modal onClose={onClose} width={600}>
      <ModalHeader title="Registro de sesión" subtitle={`${child.name} ${child.lastName} · ${currentUser.specialty}`} onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "72vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Fecha + Duración */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Fecha</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Duración</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[30, 40, 45, 60].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${duration === d ? color : "#ddd"}`,
                  background: duration === d ? `${color}15` : "#fff", color: duration === d ? color : "#888",
                  fontSize: 12, fontWeight: duration === d ? 700 : 400, fontFamily: "Inter, sans-serif", cursor: "pointer"
                }}>{d}m</button>
              ))}
            </div>
          </div>
        </div>

        {/* Objetivos trabajados */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Objetivos de la sesión</div>
          {myObjectives.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myObjectives.map(o => {
                const selected = selectedObjIds.includes(o.id);
                return (
                  <button key={o.id} onClick={() => toggleObj(o.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 8, border: `1.5px solid ${selected ? color : "#ddd"}`,
                    background: selected ? `${color}10` : "#fff", cursor: "pointer", textAlign: "left",
                    fontFamily: "Inter, sans-serif"
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? color : "#ccc"}`,
                      background: selected ? color : "#fff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: selected ? color : "#333", fontWeight: selected ? 600 : 400 }}>{o.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>No hay objetivos definidos para esta disciplina aún.</div>
          )}
          <div style={{ marginTop: 8 }}>
            <input value={customObjText} onChange={e => setCustomObjText(e.target.value)}
              placeholder="Agregar objetivo puntual de esta sesión..."
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontSize: 13 }} />
          </div>
        </div>

        {/* Actividades realizadas */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Actividades realizadas</div>
          <textarea value={activities} onChange={e => setActivities(e.target.value)} rows={3}
            placeholder={"Una por línea, ej:\nColor Code\nJuego de turnos\nMasilla"}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

        {/* Observaciones */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Observaciones clínicas</div>
          <textarea value={observation} onChange={e => setObservation(e.target.value)} rows={4}
            placeholder="Cómo estuvo el paciente, avances, dificultades observadas..."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

        {/* Recomendaciones */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Recomendaciones para casa / escuela</div>
          <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={3}
            placeholder="Indicaciones para los padres o el equipo escolar..."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

      </div>
      <div style={{ padding: "14px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#aaa" }}>{currentUser.name} · {currentUser.specialty}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" disabled={!date} onClick={handleSave}>Guardar sesión</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default SessionWizard;
