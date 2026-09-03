import React, { useState } from "react";
import { T, inputStyle, TODAY } from "../../theme.js";
import { MEETING_TYPES } from "../../constants.js";
import { Btn, Chip, Modal, ModalHeader, FieldLabel } from "../../ui/index.js";

function AddMeetingModal({ onClose, onSave }) {
  const [date, setDate] = useState(TODAY);
  const [type, setType] = useState(MEETING_TYPES[0]);
  const [participants, setParticipants] = useState("");
  const [summary, setSummary] = useState("");
  const [agreements, setAgreements] = useState("");
  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader title="Registrar minuta" subtitle="Comunicación interdisciplinaria" onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel>Fecha</FieldLabel>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MEETING_TYPES.map((t) => (
                <Chip key={t} label={t} selected={type === t} onClick={() => setType(t)} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <FieldLabel>Participantes</FieldLabel>
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Ej: María López (TO), maestra guía..." style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <FieldLabel>Resumen</FieldLabel>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="¿De qué se habló?" style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <div>
          <FieldLabel>Acuerdos</FieldLabel>
          <textarea value={agreements} onChange={(e) => setAgreements(e.target.value)} rows={2} placeholder="¿Qué se acordó?" style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!summary.trim() || !participants.trim()} onClick={() => onSave({ date, type, participants: participants.trim(), summary: summary.trim(), agreements: agreements.trim() })}>Guardar minuta</Btn>
      </div>
    </Modal>
  );
}

export default AddMeetingModal;
