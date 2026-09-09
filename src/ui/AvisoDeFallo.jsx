import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { T } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";

// Aviso de lo que NO se guardó.
//
// Deliberadamente no se cierra solo. Un toast que se desvanece a los tres
// segundos sirve para confirmar; para avisar de trabajo perdido, no: el usuario
// puede estar escribiendo en otro campo y no verlo pasar. Así se perdió la
// primera escuela de gabinete con su estudiante — la pantalla la mostraba
// creada y solo al refrescar se supo que la base nunca la recibió.
export default function AvisoDeFallo() {
  const fallos = useDataStore((s) => s.fallosDeGuardado);
  const descartar = useDataStore((s) => s.descartarFallos);
  if (!fallos.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 400,
      width: "min(560px, calc(100vw - 32px))", background: "#fff", color: T.ink,
      border: `1px solid ${T.apoyo}`, borderLeft: `5px solid ${T.apoyo}`, borderRadius: 14,
      padding: "14px 16px", fontFamily: T.font,
      boxShadow: "0 14px 40px rgba(21,47,54,0.28)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <AlertTriangle size={19} color={T.apoyo} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
            {fallos.length === 1 ? "Esto no se guardó" : `${fallos.length} cosas no se guardaron`}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.45 }}>
            Sigue en pantalla pero no llegó a la base. Vuelve a intentarlo antes de
            recargar, porque al recargar se pierde.
          </div>
          <ul style={{ margin: "9px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 5 }}>
            {fallos.map((f) => (
              <li key={f.id} style={{ fontSize: 12.5, color: T.ink }}>
                <strong>{f.que}</strong>
                <span style={{ color: T.inkSoft }}> · {f.detalle}</span>
              </li>
            ))}
          </ul>
        </div>
        <button onClick={descartar} aria-label="Descartar aviso" style={{
          background: "none", border: "none", cursor: "pointer", color: T.inkSoft,
          padding: 2, lineHeight: 0, flexShrink: 0,
        }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
