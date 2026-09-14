import React, { useState } from "react";
import { T, inputStyle, TODAY } from "../../theme.js";
import { MEETING_TYPES } from "../../constants.js";
import { Btn, Chip, Modal, ModalHeader, FieldLabel } from "../../ui/index.js";
import { avisar } from "../../store/avisosStore.js";
import { queFalta } from "../../lib/validacion.js";
import { participantesDe, faltaEnMinuta } from "../../lib/minuta.js";

// Registro de una minuta interdisciplinaria.
//
// El tipo admite varios: una reunión con la escuela Y la familia sobre el mismo
// niño es lo normal, y obligar a elegir uno hacía que el otro se perdiera —
// no aparecía en ningún filtro ni en ningún recuento.
//
// Los participantes van uno por línea. En una reunión de escuela con cinco
// personas y sus cargos, una sola línea con comas es una cadena que nadie
// vuelve a leer; separados se cuentan, se listan y salen bien en el PDF.
function AddMeetingModal({ onClose, onSave }) {
  const [date, setDate] = useState(TODAY);
  const [tipos, setTipos] = useState([]);
  const [participants, setParticipants] = useState("");
  const [summary, setSummary] = useState("");
  const [agreements, setAgreements] = useState("");

  const alternarTipo = (t) =>
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const cuantos = participantesDe(participants).length;

  const guardar = () => {
    const falta = queFalta(faltaEnMinuta({ participants, summary }).map((q) => [false, q]));
    if (falta) { avisar.error(falta); return; }
    onSave({
      date,
      type: tipos,
      participants: participantesDe(participants).join("\n"),
      summary: summary.trim(),
      agreements: agreements.trim(),
    });
  };

  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader title="Registrar minuta" subtitle="Comunicación interdisciplinaria" onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, maxHeight: "62vh", overflowY: "auto" }}>
        <div>
          <FieldLabel>Fecha</FieldLabel>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>

        <div>
          <FieldLabel>Tipo — puedes marcar varios</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {MEETING_TYPES.map((t) => (
              <Chip key={t} label={t} selected={tipos.includes(t)} casilla
                onClick={() => alternarTipo(t)} />
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>
            Participantes — uno por línea
            {cuantos > 0 && (
              <span style={{ color: T.inkFaint, fontWeight: 400 }}> · {cuantos}</span>
            )}
          </FieldLabel>
          <textarea
            value={participants} onChange={(e) => setParticipants(e.target.value)} rows={4}
            placeholder={"María López, Terapeuta Ocupacional\nMaestra guía de 1° primaria\nMadre"}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        <div>
          <FieldLabel>Resumen</FieldLabel>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
            placeholder="¿De qué se habló?"
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div>
          <FieldLabel>Acuerdos</FieldLabel>
          <textarea value={agreements} onChange={(e) => setAgreements(e.target.value)} rows={3}
            placeholder="¿Qué se acordó? Uno por línea si son varios."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar}>Guardar minuta</Btn>
      </div>
    </Modal>
  );
}

export default AddMeetingModal;
