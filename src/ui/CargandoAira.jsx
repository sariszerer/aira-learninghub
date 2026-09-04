import React from "react";
import { T } from "../theme.js";
import { AIRA_MARK_URI } from "../brand.js";

// Pantalla de carga de la aplicacion.
//
// Antes era la palabra "AIRA" escrita en texto. El logotipo es un PNG, asi que
// no se le pueden animar los trazos: la animacion es una respiracion muy suave
// sobre la imagen entera, mas una barra indeterminada debajo. La barra no es
// decoracion — un logo que solo late se confunde con un logo quieto, y hace
// falta algo que diga "esto esta trabajando".
//
// Respeta prefers-reduced-motion. No es un detalle menor en una clinica: el
// movimiento repetitivo molesta a parte de la poblacion que atiende, y la
// pantalla sigue leyendose igual de bien sin el.

const ANCHO = 132;

export default function CargandoAira({ texto }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18,
      }}
    >
      <style>{`
        @keyframes aira-respira {
          0%, 100% { transform: scale(1);    opacity: 0.78; }
          50%      { transform: scale(1.045); opacity: 1;    }
        }
        @keyframes aira-barre {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(280%); }
        }
        .aira-marca { animation: aira-respira 2s ease-in-out infinite; }
        .aira-barra { animation: aira-barre 1.15s cubic-bezier(.65,.05,.36,1) infinite; }

        @media (prefers-reduced-motion: reduce) {
          .aira-marca { animation: none; opacity: 1; }
          .aira-barra { animation: none; transform: none; width: 100% !important; opacity: 0.5; }
        }
      `}</style>

      <img
        className="aira-marca"
        src={AIRA_MARK_URI}
        alt="AIRA"
        style={{ width: ANCHO, height: "auto", display: "block" }}
      />

      <div
        aria-hidden="true"
        style={{
          width: ANCHO, height: 3, borderRadius: 999,
          background: T.border, overflow: "hidden",
        }}
      >
        <div
          className="aira-barra"
          style={{ width: "45%", height: "100%", borderRadius: 999, background: T.brand }}
        />
      </div>

      {texto && (
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.inkFaint }}>{texto}</div>
      )}
    </div>
  );
}
