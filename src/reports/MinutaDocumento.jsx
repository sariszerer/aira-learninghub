import React from "react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { participantesDe, textoDeTipos, tituloDeMinuta } from "../lib/minuta.js";
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
  const acuerdos = String(minuta.agreements || "")
    .split(/\r?\n/).map((a) => a.trim()).filter(Boolean);

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
            ? <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{minuta.summary}</p>
            : <SinDato>Sin resumen registrado.</SinDato>}
        </SeccionDoc>

        {/* Los acuerdos se omiten al imprimir si no hay ninguno: una reunión
            puede cerrarse sin acordar nada, y un título con nada debajo en un
            documento que sale del centro se lee como un fallo. */}
        <SeccionDoc titulo="Acuerdos" omitirEnImpresion={acuerdos.length === 0}>
          {acuerdos.length === 0
            ? <SinDato>No se registraron acuerdos.</SinDato>
            : <ListaDoc items={acuerdos} />}
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
