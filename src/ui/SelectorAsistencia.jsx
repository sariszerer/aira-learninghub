import React from "react";
import { T } from "../theme.js";
import { ASISTENCIA } from "../lib/reportes.js";

// Asistencia de una sesion.
//
// Hasta ahora una sesion registrada equivalia a una sesion dada: no habia forma
// de anotar que la familia no vino. El "Resumen de asistencia" del Reporte de
// Evolucion y las "Metricas de asistencia global" del Historial dependen de
// este campo — sin el, ambas secciones dirian que la asistencia es del 100%.
//
// Reprogramada existe aparte de cancelada porque no cuenta como falta: mover
// una sesion de fecha no es lo mismo que perderla, y meterlas juntas castigaria
// en el reporte a quien aviso.

const TONOS = {
  asistio: { color: T.logrado, tint: T.logradoTint },
  cancelo: { color: T.proceso, tint: T.procesoTint },
  no_show: { color: T.apoyo, tint: T.apoyoTint },
  reprogramada: { color: T.inkSoft, tint: T.surfaceSunk },
};

export default function SelectorAsistencia({ valor = "asistio", onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.entries(ASISTENCIA).map(([clave, def]) => {
        const sel = valor === clave;
        const t = TONOS[clave];
        return (
          <button
            key={clave} type="button" onClick={() => onChange(clave)}
            style={{
              flex: "1 1 90px", padding: "8px 6px", borderRadius: 8, cursor: "pointer",
              fontFamily: T.font, fontSize: 12, fontWeight: sel ? 700 : 400,
              border: `1.5px solid ${sel ? t.color : T.border}`,
              background: sel ? t.tint : T.surface,
              color: sel ? t.color : T.inkSoft,
            }}
          >
            {def.label}
          </button>
        );
      })}
    </div>
  );
}
