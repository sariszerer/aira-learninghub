import React from "react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { etiquetaGas } from "../lib/reportes.js";
import DocumentoAira from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import { SeccionDoc, SinDato, TablaDoc, ListaDoc } from "./piezas.jsx";

// Un reporte de evolución tal como se guardó.
//
// El generador compone el reporte con los datos de HOY. Eso está bien para
// hacerlo, y está mal para consultarlo: el reporte que se firmó en mayo decía
// lo que decía en mayo, y volver a generarlo con los objetivos de septiembre
// da otro documento. Si el que se entregó a la familia y el que se ve en el
// expediente no coinciden, el expediente no sirve de registro.
//
// Por eso esto pinta `content`, la instantánea que quedó guardada, y no
// recalcula nada.
export default function ReporteEvolucionGuardado({ reporte, child, users, onClose }) {
  const contenido = reporte.content || {};
  const objetivos = contenido.objetivos || [];
  const asistencia = contenido.asistencia || {};
  const responsable = users.find((u) => u.id === reporte.specialistId);
  const genero = users.find((u) => u.id === reporte.generatedBy);

  return (
    <VisorReporte
      titulo={`Evolución — ${child.name} ${child.lastName || ""}`.trim()}
      onClose={onClose}
    >
      <DocumentoAira
        titulo="Reporte de evolución"
        subtitulo={`${child.name} ${child.lastName || ""}`.trim()}
        confidencial
        meta={[
          { etiqueta: "Período", valor: `${fmtDate(reporte.fromDate)} – ${fmtDate(reporte.toDate)}` },
          { etiqueta: "Área", valor: reporte.specialty || "Todas" },
          { etiqueta: "Responsable", valor: responsable?.name },
          { etiqueta: "Generado", valor: fmtDate(reporte.generatedDate) },
        ]}
      >
        <SeccionDoc titulo="Asistencia del período">
          {asistencia.total ? (
            <TablaDoc
              columnas={[
                { clave: "total", titulo: "Sesiones" },
                { clave: "asistidas", titulo: "Asistidas" },
                { clave: "canceladas", titulo: "Canceladas" },
                { clave: "ausencias", titulo: "Ausencias" },
              ]}
              filas={[{ id: "a", ...asistencia }]}
            />
          ) : (
            <SinDato>No se registró asistencia en este período.</SinDato>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Avance por objetivo">
          {objetivos.length === 0 ? (
            <SinDato>No se registraron objetivos trabajados.</SinDato>
          ) : (
            <TablaDoc
              columnas={[
                { clave: "nombre", titulo: "Objetivo" },
                { clave: "estado", titulo: "Estado" },
                { clave: "gas", titulo: "Escala GAS",
                  celda: (o) => etiquetaGas(o.gas?.actual) ?? "—" },
                { clave: "vecesTrabajado", titulo: "Veces trabajado", alinear: "right" },
              ]}
              filas={objetivos.map((o, i) => ({ id: i, ...o }))}
            />
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Logros del período" omitirEnImpresion={!(contenido.logros || []).length}>
          <ListaDoc items={contenido.logros || []} vacio="No se registraron logros en este período." />
        </SeccionDoc>

        <SeccionDoc titulo="Áreas de atención" omitirEnImpresion={!(contenido.areasDeAtencion || []).length}>
          <ListaDoc items={contenido.areasDeAtencion || []} vacio="No se señalaron áreas de atención." />
        </SeccionDoc>

        <SeccionDoc titulo="Ajustes al plan" omitirEnImpresion={!String(contenido.ajustes || "").trim()}>
          {String(contenido.ajustes || "").trim()
            ? <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{contenido.ajustes}</p>
            : <SinDato>Sin ajustes registrados.</SinDato>}
        </SeccionDoc>

        <SeccionDoc titulo="Recomendaciones" omitirEnImpresion={!String(contenido.recomendaciones || "").trim()}>
          {String(contenido.recomendaciones || "").trim()
            ? <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{contenido.recomendaciones}</p>
            : <SinDato>Sin recomendaciones registradas.</SinDato>}
        </SeccionDoc>

        <div style={{
          marginTop: 26, paddingTop: 10, borderTop: `1px solid ${T.border}`,
          fontSize: 10.5, color: T.inkFaint, lineHeight: 1.6,
        }}>
          Generado el {fmtDate(reporte.generatedDate)}
          {genero ? ` por ${genero.name}` : ""}. Este documento reproduce el
          reporte tal como se guardó: no se recalcula con datos posteriores.
        </div>
      </DocumentoAira>
    </VisorReporte>
  );
}
