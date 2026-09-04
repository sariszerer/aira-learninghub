import React from "react";
import { Search } from "lucide-react";
import { T } from "../theme.js";

// Encabezado del area de contenido: buscador a la izquierda, titulo de la
// pantalla debajo, y espacio a la derecha para las acciones de cada vista.
//
// Va separado de la barra lateral porque cambia con la pantalla, mientras que
// la navegacion no.
export default function PageHeader({ titulo, subtitulo, buscar, onBuscar, acciones }) {
  return (
    <div style={{
      // Fijo al hacer scroll: el buscador y el titulo son la referencia de la
      // pantalla y perderlos al bajar obliga a subir para saber donde estas.
      position: "sticky", top: 0, zIndex: 10,
      background: T.surface, borderBottom: `1px solid ${T.border}`,
      padding: "14px 28px 0",
    }}>
      {onBuscar && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: T.surfaceSunk, borderRadius: T.radiusSm,
            padding: "8px 12px", width: 340, maxWidth: "100%",
          }}>
            <Search size={15} color={T.inkFaint} />
            <input
              value={buscar || ""}
              onChange={(e) => onBuscar(e.target.value)}
              placeholder="Buscar paciente, especialista…"
              style={{
                border: "none", background: "none", outline: "none", flex: 1,
                fontFamily: T.font, fontSize: 13.5, color: T.ink,
              }}
            />
          </div>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: 16, paddingBottom: 16,
      }}>
        <div>
          <div style={{
            fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em",
          }}>
            {titulo}
          </div>
          {subtitulo && (
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{subtitulo}</div>
          )}
        </div>
        {acciones && <div style={{ display: "flex", gap: 8 }}>{acciones}</div>}
      </div>
    </div>
  );
}
