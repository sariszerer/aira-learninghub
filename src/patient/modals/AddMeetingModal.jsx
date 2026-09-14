import React, { useState } from "react";
import { T, inputStyle, TODAY } from "../../theme.js";
import { MEETING_TYPES } from "../../constants.js";
import { Btn, Chip, EditorTexto, Modal, ModalHeader, FieldLabel } from "../../ui/index.js";
import { avisar } from "../../store/avisosStore.js";
import { queFalta } from "../../lib/validacion.js";
import { participantesDe, participantesATexto, faltaEnMinuta } from "../../lib/minuta.js";
import { limpiarHtml, htmlATexto } from "../../lib/textoRico.js";

// Registro y correccion de una minuta interdisciplinaria.
//
// El tipo admite varios: una reunión con la escuela Y la familia sobre el mismo
// niño es lo normal, y obligar a elegir uno hacía que el otro se perdiera —
// no aparecía en ningún filtro ni en ningún recuento.
//
// Los participantes van uno por línea. En una reunión de escuela con cinco
// personas y sus cargos, una sola línea con comas es una cadena que nadie
// vuelve a leer; separados se cuentan, se listan y salen bien en el PDF.
//
// El mismo formulario sirve para corregir una ya registrada. Es un formulario
// y no otro porque los dos escriben la misma minuta: duplicarlo garantiza que
// dentro de un mes el de editar no tenga el campo que se anada al de crear.
function AddMeetingModal({ onClose, onSave, minuta = null }) {
  const editando = !!minuta;
  const [date, setDate] = useState(minuta?.date || TODAY);
  const [tipos, setTipos] = useState(minuta?.type ? [...minuta.type] : []);
  const [participants, setParticipants] = useState(participantesATexto(minuta?.participants));
  const [summary, setSummary] = useState(minuta?.summary || "");
  const [agreements, setAgreements] = useState(minuta?.agreements || "");

  const alternarTipo = (t) =>
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const cuantos = participantesDe(participants).length;

  const guardar = () => {
    // Se valida el texto, no el HTML: un campo donde solo se pulso Enter vale
    // "<div><br></div>", que no esta vacio como cadena y no dice nada.
    const falta = queFalta(
      faltaEnMinuta({ participants, summary: htmlATexto(summary) }).map((q) => [false, q])
    );
    if (falta) { avisar.error(falta); return; }
    onSave({
      // Al corregir se conserva la minuta entera y se pisan los campos: id,
      // childId y createdBy siguen siendo los mismos. Quien la registro no
      // cambia porque otra persona la corrija.
      ...(minuta || {}),
      date,
      type: tipos,
      participants: participantesDe(participants).join("\n"),
      summary: limpiarHtml(summary),
      agreements: limpiarHtml(agreements),
    });
  };

  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader
        title={editando ? "Editar minuta" : "Registrar minuta"}
        subtitle="Comunicación interdisciplinaria"
        onClose={onClose}
      />
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

        {/* Con formato: la minuta sale del centro y poder resaltar el
            acuerdo que importa cambia si alguien la lee o no. */}
        <div>
          <FieldLabel>Resumen</FieldLabel>
          <EditorTexto valor={summary} onChange={setSummary} filas={5}
            placeholder="¿De qué se habló?" />
        </div>

        <div>
          <FieldLabel>Acuerdos</FieldLabel>
          <EditorTexto valor={agreements} onChange={setAgreements} filas={3}
            placeholder={"¿Qué se acordó? Uno por línea si son varios."} />
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar}>
          {editando ? "Guardar cambios" : "Guardar minuta"}
        </Btn>
      </div>
    </Modal>
  );
}

export default AddMeetingModal;
