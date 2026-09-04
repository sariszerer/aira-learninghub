import React from "react";
import { Check } from "lucide-react";
import { T } from "../theme.js";

// Chip seleccionable: filtros y selecciones multiples.
//
// Forma de pildora (999px), la misma de las etiquetas de estado. Antes convivian
// tres radios distintos para lo mismo — 11px en este componente, 20px en los
// filtros de sesiones y gabinete, y 999px en las pantallas nuevas — y eso es
// justo lo que hacia que la interfaz se viera de dos autores.
//
// `casilla` dibuja el recuadro de verificacion. Se activa donde el chip es una
// seleccion multiple real (asignar especialistas); en un filtro donde solo hay
// una opcion activa, el color ya lo comunica y la casilla es ruido.
function Chip({ label, selected, onClick, tone = "brand", casilla = false, size = "md" }) {
  const activo = tone === "brand"
    ? { bg: T.brandTint, fg: T.brand, borde: T.brand }
    : { bg: T.amberTint, fg: T.amberDeep, borde: T.amber };

  const s = size === "sm"
    ? { padding: "4px 10px", fontSize: 12 }
    : { padding: "6px 12px", fontSize: 12.5 };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: s.padding, fontSize: s.fontSize, borderRadius: 999,
        fontFamily: T.font, fontWeight: selected ? 600 : 500, cursor: "pointer",
        border: `1px solid ${selected ? activo.borde : T.border}`,
        background: selected ? activo.bg : T.surface,
        color: selected ? activo.fg : T.inkSoft,
        whiteSpace: "nowrap",
        transition: "background .12s ease, border-color .12s ease",
      }}
    >
      {casilla && (
        <span style={{
          width: 14, height: 14, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${selected ? activo.fg : T.border}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {selected && <Check size={10} strokeWidth={3} />}
        </span>
      )}
      {label}
    </button>
  );
}

export default Chip;
