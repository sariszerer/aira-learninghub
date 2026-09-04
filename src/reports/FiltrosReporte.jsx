import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { T, inputStyle } from "../theme.js";
import { Chip } from "../ui/index.js";

// Barra de filtros de generacion. El documento los enumera: seleccion de
// especialidad (cuando el paciente tenga mas de una activa), rango de fechas, y
// para el Historial la opcion de excluir la bitacora detallada por su extension.
//
// Lleva no-imprimir: son controles de la pantalla, no parte del documento.

export default function FiltrosReporte({
  desde, setDesde, hasta, setHasta,
  especialidad, setEspecialidad, especialidades = [],
  minDate, extra,
}) {
  // Con una sola disciplina activa el selector no ofrece ninguna decision.
  const mostrarEspecialidad = setEspecialidad && especialidades.length > 1;

  return (
    <div
      className="no-imprimir"
      style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        padding: "10px 12px", marginBottom: 18,
        background: T.surfaceSunk, borderRadius: 8,
      }}
    >
      <SlidersHorizontal size={14} color={T.inkFaint} />

      <label style={etiqueta}>
        Desde
        <input
          type="date" value={desde || ""} min={minDate || undefined} max={hasta || undefined}
          onChange={(e) => setDesde(e.target.value)}
          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12.5 }}
        />
      </label>

      <label style={etiqueta}>
        Hasta
        <input
          type="date" value={hasta || ""} min={desde || minDate || undefined}
          onChange={(e) => setHasta(e.target.value)}
          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12.5 }}
        />
      </label>

      {mostrarEspecialidad && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600 }}>Especialidad</span>
          {["Todas", ...especialidades].map((sp) => (
            <Chip
              key={sp} label={sp}
              selected={especialidad === sp}
              onClick={() => setEspecialidad(sp)}
            />
          ))}
        </div>
      )}

      {extra}
    </div>
  );
}

const etiqueta = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 11, color: T.inkFaint, fontWeight: 600,
};
