import React from "react";
import { T } from "../theme.js";

// Pestañas como control segmentado: riel gris hundido y la activa como pastilla
// blanca con sombra. Es el mismo tratamiento del elemento activo del menu
// lateral, que es el que mejor separa "donde estoy" de "donde puedo ir".
//
// Sustituye al subrayado anterior, que venia del tema serif y dejaba las
// inactivas en italica.
export default function Tabs({ tabs, activo, onCambiar }) {
  return (
    <div
      className="aira-tabs"
      style={{
        display: "inline-flex", gap: 2, padding: 3,
        background: T.surfaceSunk, borderRadius: T.radiusSm,
        marginBottom: 20, maxWidth: "100%", overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const on = activo === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onCambiar(t.id)}
            style={{
              padding: "7px 13px", borderRadius: T.radiusSm - 2, border: "none",
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: T.font,
              fontSize: 13.5, fontWeight: on ? 600 : 500,
              color: on ? T.ink : T.inkSoft,
              background: on ? T.surface : "transparent",
              boxShadow: on ? T.shadow : "none",
              transition: "background .15s ease, color .15s ease",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
