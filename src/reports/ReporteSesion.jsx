import React from "react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { ASISTENCIA } from "../lib/reportes.js";
import { textoDeModalidad } from "../lib/modalidad.js";
import DocumentoAira from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import BloqueFirma from "./BloqueFirma.jsx";
import { SeccionDoc, SinDato, ListaDoc } from "./piezas.jsx";

// El acta de UNA sesión, para imprimir y entregar.
//
// Los reportes que había cubren un período: evolución, historial, familia. Lo
// que faltaba era el documento de la sesión de hoy — el que la familia pide al
// salir y el que la escuela quiere ver. Se armaba a mano cada vez.
//
// Lleva lo que se pidió y nada más: los objetivos que se trabajaron, las
// actividades que se hicieron, y las observaciones para casa o escuela. El
// visor permite corregir el texto antes de imprimirlo, porque una redacción
// generada nunca sale lista para entregar.

export default function ReporteSesion({ sesion, child, objectives, users, onClose }) {
  const responsable = users.find((u) => u.id === sesion.specialistId);
  const acompanante = users.find((u) => u.id === sesion.conEspecialista);
  const conQuien = textoDeModalidad(sesion.modalidad, acompanante?.name);

  // Los objetivos tal como quedaron marcados en la sesión. Se resuelve el
  // nombre contra la lista viva porque en la sesión solo hay identificadores;
  // un objetivo borrado desde entonces se descarta en vez de salir en blanco.
  const trabajados = (sesion.objectivesWorked || [])
    .map((ow) => ({ ...ow, objetivo: objectives.find((o) => o.id === ow.objectiveId) }))
    .filter((w) => w.objetivo);

  const actividades = (sesion.activities || []).filter(Boolean);
  const asistencia = ASISTENCIA[sesion.attendance] || ASISTENCIA.asistio;

  const meta = [
    { etiqueta: "Fecha", valor: fmtDate(sesion.date) },
    { etiqueta: "Área", valor: sesion.specialty },
    { etiqueta: "Especialista", valor: responsable?.name },
    { etiqueta: "Duración", valor: sesion.duration ? `${sesion.duration} min` : null },
    { etiqueta: "Asistencia", valor: asistencia?.label },
    conQuien ? { etiqueta: "Sesión", valor: conQuien } : null,
  ].filter(Boolean);

  return (
    <VisorReporte
      titulo={`Sesión del ${fmtDate(sesion.date)} — ${child.name} ${child.lastName || ""}`.trim()}
      onClose={onClose}
    >
      <DocumentoAira
        titulo="Reporte de sesión"
        subtitulo={`${child.name} ${child.lastName || ""}`.trim()}
        confidencial
        meta={meta}
      >
        <SeccionDoc titulo="Objetivos trabajados">
          {trabajados.length === 0 ? (
            <SinDato>No se marcaron objetivos en esta sesión.</SinDato>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
              {trabajados.map((w) => (
                <li key={w.objectiveId}>
                  {w.objetivo.name}
                  {w.objetivo.area ? (
                    <span style={{ color: T.inkFaint }}> · {w.objetivo.area}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Actividades realizadas">
          <ListaDoc items={actividades} vacio="No se describieron actividades." />
        </SeccionDoc>

        {/* Lo que se lleva la familia. Va con su propio título y no mezclado
            con la observación clínica: es lo único de este documento que
            alguien tiene que hacer al llegar a casa. */}
        <SeccionDoc
          titulo="Observaciones y recomendaciones para casa o escuela"
          omitirEnImpresion={!String(sesion.observation || "").trim() && !String(sesion.nextSteps || "").trim()}
        >
          {String(sesion.observation || "").trim() ? (
            <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
              {sesion.observation}
            </p>
          ) : (
            <SinDato>Sin observaciones registradas.</SinDato>
          )}
          {String(sesion.nextSteps || "").trim() && (
            <p style={{
              fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap",
              margin: "10px 0 0", fontWeight: 600,
            }}>
              {sesion.nextSteps}
            </p>
          )}
        </SeccionDoc>

        <BloqueFirma
          responsable={responsable}
          datos={[
            { etiqueta: "Especialidad", valor: responsable?.specialty || sesion.specialty },
            {
              etiqueta: "N° de idoneidad",
              valor: responsable?.licenseNo,
              faltante: "Sin registrar en el perfil del especialista",
            },
          ]}
        />
      </DocumentoAira>
    </VisorReporte>
  );
}
