import React from "react";
import { T } from "../theme.js";

// Estado vacio. Uno solo para toda la aplicacion.
//
// Habia trece escritos a mano: unos alineados a la izquierda y otros centrados,
// con paddings de 8, 12, 24, 30 y 40px, cuatro tamanos de fuente y algun gris
// incrustado. Dos secciones contiguas se veian de autores distintos por eso.
//
// `dentroDeCaja` sirve para cuando ya hay una tarjeta alrededor: entonces no
// dibuja la suya y solo aporta el texto centrado.
export default function EmptyNote({ text, children, dentroDeCaja = false, icono: Icono }) {
  const contenido = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "28px 20px", textAlign: "center",
      fontFamily: T.font, fontSize: 13.5, color: T.inkFaint,
    }}>
      {Icono && <Icono size={20} strokeWidth={1.8} />}
      <span>{text || children}</span>
    </div>
  );

  if (dentroDeCaja) return contenido;

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.radius, boxShadow: T.shadow,
    }}>
      {contenido}
    </div>
  );
}
