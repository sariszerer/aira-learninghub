import React from "react";
import { Search } from "lucide-react";
import { T } from "../theme.js";

// Encabezado del area de contenido.
//
// El titulo va PRIMERO y el buscador debajo, junto a las acciones. Antes el
// buscador iba arriba del todo y empujaba el titulo hacia abajo: se leia antes
// la herramienta que el sitio donde estas.
export default function PageHeader({ titulo, subtitulo, buscar, onBuscar, acciones }) {
  return (
    <div style={{
      // Fijo al hacer scroll: el titulo y el buscador son la referencia de la
      // pantalla y perderlos al bajar obliga a subir para saber donde estas.
      position: "sticky", top: 0, zIndex: 10,
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      padding: "18px 28px 16px",
    }}>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>
        {titulo}
      </div>
      {subtitulo && (
        <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{subtitulo}</div>
      )}

      {(onBuscar || acciones) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginTop: 14, flexWrap: "wrap",
        }}>
          {onBuscar ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm, padding: "8px 12px", width: 320, maxWidth: "100%",
            }}>
              <Search size={15} color={T.inkFaint} />
              <input
                value={buscar || ""}
                onChange={(e) => onBuscar(e.target.value)}
                placeholder="Buscar…"
                style={{
                  border: "none", background: "none", outline: "none", flex: 1, minWidth: 0,
                  fontFamily: T.font, fontSize: 13.5, color: T.ink,
                }}
              />
            </div>
          ) : <span />}
          {acciones && <div style={{ display: "flex", gap: 8 }}>{acciones}</div>}
        </div>
      )}
    </div>
  );
}
