import React, { useMemo, useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { T, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, Modal, ModalHeader } from "../ui/index.js";
import { contar } from "../lib/format.js";

// Borrado definitivo de un paciente.
//
// No es "dar de alta" ni "cerrar proceso": esos conservan la historia clínica.
// Esto la destruye — la base borra en cascada sesiones, objetivos, documentos,
// reuniones y reportes de evolución — y en un expediente de un menor eso no se
// deshace con un ctrl+Z.
//
// Por eso el modal hace dos cosas que un confirm() no hace: enumera lo que se
// va a perder con las cifras reales de ESTE expediente, y exige escribir el
// nombre completo. El recuento es lo que evita el error de verdad: quien iba a
// borrar un duplicado vacío ve "0 sesiones" y sigue; quien se equivocó de ficha
// ve "38 sesiones" y para.
export default function BorrarPacienteModal({ child, onClose, onBorrado }) {
  const borrarPaciente = useDataStore((s) => s.borrarPaciente);
  const sessions = useDataStore((s) => s.sessions);
  const objectives = useDataStore((s) => s.objectives);
  const documents = useDataStore((s) => s.documents);

  const [texto, setTexto] = useState("");
  const [borrando, setBorrando] = useState(false);

  const nombre = `${child.name} ${child.lastName || ""}`.trim();
  const arrastra = useMemo(() => [
    [sessions.filter((s) => s.childId === child.id).length, "sesión", "sesiones"],
    [objectives.filter((o) => o.childId === child.id).length, "objetivo", "objetivos"],
    [documents.filter((d) => d.childId === child.id).length, "documento", "documentos"],
  ].filter(([n]) => n > 0), [sessions, objectives, documents, child.id]);

  // La comparación ignora mayúsculas y espacios de sobra: el propósito es que
  // el usuario lea el nombre y confirme cuál es, no ganarle a un dictado.
  const confirmado = texto.trim().toLowerCase() === nombre.toLowerCase();

  const borrar = async () => {
    setBorrando(true);
    try {
      await borrarPaciente(child.id);
      onBorrado?.();
    } catch {
      // El aviso de fallo ya lo publica el store; aquí solo se reabre el botón.
      setBorrando(false);
    }
  };

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader title="Borrar paciente" subtitle={nombre} onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          display: "flex", gap: 11, padding: "13px 15px", borderRadius: 12,
          background: T.apoyoTint, border: `1px solid ${T.apoyo}`,
        }}>
          <AlertTriangle size={19} color={T.apoyo} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
            Esto no se puede deshacer. Si el paciente terminó su tratamiento,
            usa <strong>Cerrar proceso</strong>: conserva el expediente.
          </div>
        </div>

        {arrastra.length > 0 && (
          <div>
            <div style={{
              fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7,
            }}>
              También se borra
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
              {arrastra.map(([n, sing, plur]) => (
                <li key={sing} style={{ fontSize: 13.5, color: T.ink }}>· {contar(n, sing, plur)}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 7 }}>
            Escribe <strong style={{ color: T.ink }}>{nombre}</strong> para confirmar.
          </div>
          <input
            value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus
            placeholder={nombre}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
          />
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={borrar} disabled={!confirmado || borrando}>
          <Trash2 size={14} style={{ marginRight: 6 }} />
          {borrando ? "Borrando…" : "Borrar definitivamente"}
        </Btn>
      </div>
    </Modal>
  );
}
