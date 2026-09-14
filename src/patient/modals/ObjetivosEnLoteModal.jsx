import React, { useMemo, useState } from "react";
import { ListPlus } from "lucide-react";
import { T, inputStyle } from "../../theme.js";
import { Btn, Modal, ModalHeader } from "../../ui/index.js";
import { avisar } from "../../store/avisosStore.js";
import { objetivosDeTexto } from "../../lib/objetivosEnLote.js";

// Cargar varios objetivos de una vez, uno por línea.
//
// El plan de trabajo llega en un PDF con ocho o diez objetivos ya redactados.
// Pasarlos de uno en uno son diez veces: abrir el modal, escribir, guardar,
// cerrar. Copiar la lista del PDF y pegarla aquí es una.
//
// No se leen del PDF automáticamente a propósito. Un plan clínico escaneado o
// maquetado en columnas se extrae mal, y un objetivo mal transcrito en un
// expediente es peor que uno no cargado: parece correcto y nadie lo revisa.
// Copiar y pegar lo escribe la persona que sabe qué dice el plan.
export default function ObjetivosEnLoteModal({ area, onClose, onCrear }) {
  const [texto, setTexto] = useState("");
  const objetivos = useMemo(() => objetivosDeTexto(texto), [texto]);

  const guardar = () => {
    if (objetivos.length === 0) {
      avisar.error("Escribe al menos un objetivo, uno por línea.");
      return;
    }
    onCrear(objetivos);
  };

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHeader
        title="Agregar varios objetivos"
        subtitle={area ? `Se crearán en ${area}` : "Uno por línea"}
        onClose={onClose}
      />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6 }}>
          Copia la lista del plan de trabajo y pégala aquí, un objetivo por línea.
          Se quitan las viñetas y la numeración si vienen pegadas.
        </p>

        <textarea
          value={texto} onChange={(e) => setTexto(e.target.value)} rows={10} autoFocus
          placeholder={"1. Sostener el lápiz con pinza trípode\n2. Recortar siguiendo una línea recta\n- Mantener la atención 10 minutos"}
          style={{
            ...inputStyle, width: "100%", boxSizing: "border-box",
            resize: "vertical", lineHeight: 1.7, fontSize: 14,
          }}
        />

        {/* Se enseña lo que se va a crear antes de crearlo: pegar de un PDF
            arrastra encabezados y números de página, y verlos aquí es más
            barato que borrar seis objetivos inventados del expediente. */}
        {objetivos.length > 0 && (
          <div style={{
            border: `1px solid ${T.border}`, borderRadius: 11, padding: "12px 14px",
            background: T.surfaceSunk,
          }}>
            <div style={{
              fontSize: 11.5, fontWeight: 700, color: T.inkFaint, marginBottom: 7,
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              Se crearán {objetivos.length}
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: T.ink, lineHeight: 1.7 }}>
              {objetivos.map((o, i) => <li key={i}>{o}</li>)}
            </ol>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn icon={ListPlus} onClick={guardar}>
          Crear {objetivos.length > 0 ? objetivos.length : ""} {objetivos.length === 1 ? "objetivo" : "objetivos"}
        </Btn>
      </div>
    </Modal>
  );
}
