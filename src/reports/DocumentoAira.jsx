import React from "react";
import { T } from "../theme.js";
import { Logo } from "../ui/index.js";

// Marco de marca compartido por los tres reportes.
//
// El documento lo pide explicito: "Los tres formatos comparten el mismo
// encabezado (logo Aira) y pie de pagina (paleta azul, datos de contacto)". Que
// viva en un solo componente es lo que hace que se cumpla: tres cabeceras
// copiadas divergen a la primera correccion.
//
// La clase doc-imprimible es la que EstilosImpresion usa para aislar esto del
// resto de la aplicacion al imprimir.

export const CONTACTO_AIRA = {
  nombre: "AIRA Learning Hub",
  telefono: "+507 6000-0000",
  correo: "info@airalearninghub.com",
  ciudad: "Ciudad de Panamá, Panamá",
};

export default function DocumentoAira({
  titulo,
  subtitulo,
  meta = [],
  confidencial = false,
  children,
}) {
  return (
    <div
      className="doc-imprimible"
      style={{
        background: "#fff",
        color: T.ink,
        fontFamily: T.font,
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <header
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 20, paddingBottom: 14, borderBottom: `2.5px solid ${T.brand}`,
        }}
      >
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: T.brand, letterSpacing: "-0.01em" }}>
            {titulo}
          </div>
          {subtitulo && (
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{subtitulo}</div>
          )}
        </div>
        <Logo width={86} />
      </header>

      {confidencial && (
        // "Debe incluir siempre un aviso de confidencialidad de datos de salud
        // en el encabezado o pie del documento."
        <div
          style={{
            marginTop: 12, padding: "8px 12px", borderRadius: 6,
            background: T.brandTint, color: T.brandDeep,
            fontSize: 11.5, fontWeight: 600, letterSpacing: "0.01em",
          }}
        >
          Documento confidencial · Contiene datos de salud de un menor. Su
          divulgación está restringida al personal autorizado y a los tutores legales.
        </div>
      )}

      {meta.length > 0 && (
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px 20px", marginTop: 14, padding: "12px 14px",
            background: T.surfaceSunk, borderRadius: 8,
          }}
        >
          {meta.filter((m) => m).map((m) => (
            <div key={m.etiqueta}>
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: T.inkFaint,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {m.etiqueta}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>
                {m.valor || "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <main style={{ marginTop: 18 }}>{children}</main>

      <footer
        style={{
          marginTop: 26, paddingTop: 12, borderTop: `2.5px solid ${T.brand}`,
          display: "flex", justifyContent: "space-between", gap: 16,
          fontSize: 10.5, color: T.inkSoft,
        }}
      >
        <div>
          <span style={{ fontWeight: 700, color: T.brand }}>{CONTACTO_AIRA.nombre}</span>
          {" · "}{CONTACTO_AIRA.ciudad}
        </div>
        <div>{CONTACTO_AIRA.telefono} · {CONTACTO_AIRA.correo}</div>
      </footer>
    </div>
  );
}
