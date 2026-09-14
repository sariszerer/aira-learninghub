import React from "react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { participantesDe, textoDeTipos, tituloDeMinuta } from "../lib/minuta.js";
import { textoAHtml, esHtml, htmlATexto } from "../lib/textoRico.js";
import DocumentoAira from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import { SeccionDoc, SinDato, ListaDoc } from "./piezas.jsx";

// La minuta como documento imprimible, para mandarla fuera del centro.
//
// Usa el mismo visor y el mismo papel que los tres reportes: se imprime a PDF
// con el encabezado de AIRA, se puede corregir a mano antes de firmarla, y
// pagina igual. Montar un PDF aparte habría significado un segundo motor de
// impresión que se desincroniza del primero a la tercera semana.
export default function MinutaDocumento({ minuta, child, users, onClose }) {
  const autor = users.find((u) => u.id === minuta.createdBy);
  const participantes = participantesDe(minuta.participants);
  // Con formato propio se pinta tal cual; el texto de antes del editor
  // sigue saliendo en vinetas, un acuerdo por linea.
  const acuerdosPlanos = esHtml(minuta.agreements)
    ? null
    : String(minuta.agreements || "").split(/\r?\n/).map((a) => a.trim()).filter(Boolean);
  const sinAcuerdos = acuerdosPlanos
    ? acuerdosPlanos.length === 0
    : !htmlATexto(minuta.agreements).trim();

  return (
    <VisorReporte titulo={tituloDeMinuta(minuta, child)} onClose={onClose}>
      <DocumentoAira
        titulo="Minuta de reunión interdisciplinaria"
        subtitulo={`${child.name} ${child.lastName || ""}`.trim()}
        confidencial
        meta={[
          { etiqueta: "Fecha de la reunión", valor: fmtDate(minuta.date) },
          { etiqueta: "Tipo", valor: textoDeTipos(minuta.type) },
          { etiqueta: "Registrada por", valor: autor?.name },
          { etiqueta: "N° de expediente", valor: child.recordNo },
        ]}
      >
        <SeccionDoc titulo="Participantes">
          {participantes.length === 0
            ? <SinDato>No se registraron los participantes.</SinDato>
            : <ListaDoc items={participantes} />}
        </SeccionDoc>

        <SeccionDoc titulo="Temas tratados">
          {minuta.summary
            ? <div
                style={{ fontSize: 12, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: textoAHtml(minuta.summary) }}
              />
            : <SinDato>Sin resumen registrado.</SinDato>}
        </SeccionDoc>

        {/* Los acuerdos se omiten al imprimir si no hay ninguno: una reunión
            puede cerrarse sin acordar nada, y un título con nada debajo en un
            documento que sale del centro se lee como un fallo. */}
        <SeccionDoc titulo="Acuerdos" omitirEnImpresion={sinAcuerdos}>
          {sinAcuerdos ? (
            <SinDato>No se registraron acuerdos.</SinDato>
          ) : acuerdosPlanos ? (
            <ListaDoc items={acuerdosPlanos} />
          ) : (
            <div
              style={{ fontSize: 12, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: textoAHtml(minuta.agreements) }}
            />
          )}
        </SeccionDoc>

        <div style={{
          marginTop: 26, paddingTop: 10, borderTop: `1px solid ${T.border}`,
          fontSize: 10.5, color: T.inkFaint, lineHeight: 1.6,
        }}>
          Documento confidencial. Contiene información clínica de un menor y se
          comparte únicamente con las personas que participaron en la reunión.
        </div>
      </DocumentoAira>
    </VisorReporte>
  );
}
