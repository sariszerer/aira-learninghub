import React, { useMemo, useState } from "react";
import { T, TODAY } from "../theme.js";
import { contar, fmtDate, fmtDateShort } from "../lib/format.js";
import {
  ASISTENCIA, resumenAsistencia, especialistasInvolucrados, evaluacionesIniciales,
  planesPorDisciplina, estadoDelPaciente, sesionesEnRango, textoRango,
} from "../lib/reportes.js";
import DocumentoAira from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import FiltrosReporte from "./FiltrosReporte.jsx";
import { SeccionDoc, SinDato, TablaDoc, EscalaGas, ListaDoc } from "./piezas.jsx";

// Historial Clínico Completo — seccion 2 de Formatos_Reportes_AIRA.docx.
//
// "El reporte mas sensible: el acceso debe restringirse por rol (admin /
// director clinico), con registro de quien lo genero y cuando." El permiso
// report:history:generate lo cierra; el encabezado deja constancia del usuario
// y la fecha, y el aviso de confidencialidad va siempre.

export default function HistorialClinico({
  child, sessions, objectives, documents, meetings, users, parentReports,
  evolutionReports = [], currentUser, onClose,
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState(TODAY);
  const [especialidad, setEspecialidad] = useState("Todas");
  // "Al ser potencialmente extenso, conviene permitir filtrar... opcion de
  // incluir o excluir la bitacora detallada de sesiones (por su extension)."
  const [conBitacora, setConBitacora] = useState(true);

  const todasDelNino = useMemo(
    () => sesionesEnRango(sessions, child.id, desde, hasta),
    [sessions, child.id, desde, hasta]
  );
  const sesiones = useMemo(
    () => (especialidad === "Todas" ? todasDelNino : todasDelNino.filter((s) => s.specialty === especialidad)),
    [todasDelNino, especialidad]
  );

  const objetivos = useMemo(() => {
    const delNino = objectives.filter((o) => o.childId === child.id);
    return especialidad === "Todas" ? delNino : delNino.filter((o) => o.area === especialidad);
  }, [objectives, child.id, especialidad]);

  const docsDelNino = useMemo(
    () => (documents || []).filter((d) => d.childId === child.id),
    [documents, child.id]
  );
  const reunionesDelNino = useMemo(
    () => (meetings || []).filter((m) => m.childId === child.id).sort((a, b) => (a.date || "").localeCompare(b.date || "")),
    [meetings, child.id]
  );

  const asistencia = useMemo(() => resumenAsistencia(sesiones), [sesiones]);
  const equipo = useMemo(
    () => especialistasInvolucrados(sesiones, users, child.assignedSpecialists || []),
    [sesiones, users, child.assignedSpecialists]
  );
  const evaluaciones = useMemo(() => evaluacionesIniciales(docsDelNino), [docsDelNino]);
  const planes = useMemo(() => planesPorDisciplina(objetivos, users), [objetivos, users]);

  const reportesEvolucion = useMemo(
    () => evolutionReports.filter((r) => r.childId === child.id)
      .sort((a, b) => (b.generatedDate || "").localeCompare(a.generatedDate || "")),
    [evolutionReports, child.id]
  );
  const reportesPadres = useMemo(
    () => (parentReports || []).filter((r) => r.childId === child.id)
      .sort((a, b) => (b.generatedDate || "").localeCompare(a.generatedDate || "")),
    [parentReports, child.id]
  );

  const contacto = child.parentContact || {};
  const nombreUsuario = users.find((u) => u.id === currentUser?.id)?.name || currentUser?.name;

  return (
    <VisorReporte titulo="Historial Clínico Completo" onClose={onClose}>
      <FiltrosReporte
        desde={desde} setDesde={setDesde}
        hasta={hasta} setHasta={setHasta}
        especialidad={especialidad} setEspecialidad={setEspecialidad}
        especialidades={child.specialties || []}
        extra={
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.inkFaint, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={conBitacora} onChange={(e) => setConBitacora(e.target.checked)} />
            Incluir bitácora detallada ({sesiones.length} sesiones)
          </label>
        }
      />

      <DocumentoAira
        titulo="Historial Clínico Completo"
        subtitulo={`${child.name} ${child.lastName}`}
        confidencial
        meta={[
          { etiqueta: "Expediente", valor: child.recordNo },
          { etiqueta: "Rango cubierto", valor: textoRango(desde, hasta) },
          { etiqueta: "Fecha de generación", valor: fmtDate(TODAY) },
          { etiqueta: "Generado por", valor: nombreUsuario },
        ]}
      >
        <SeccionDoc titulo="Datos de identificación">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "8px 20px" }}>
            <Dato k="Nombre completo" v={`${child.name} ${child.lastName}`} />
            <Dato k="Fecha de nacimiento" v={child.birthDate && fmtDate(child.birthDate)} />
            <Dato k="Edad actual" v={child.age != null ? `${child.age} años` : null} />
            <Dato k="Colegio" v={child.school} />
            <Dato k="Padre / tutor" v={contacto.name} />
            <Dato k="Contacto" v={[contacto.phone, contacto.email].filter(Boolean).join(" · ")} />
            <Dato k="Fecha de ingreso a AIRA" v={child.admissionDate && fmtDate(child.admissionDate)} />
            <Dato k="Especialidades activas" v={(child.specialties || []).join(", ")} />
          </div>
          <div style={{ marginTop: 8 }}>
            <Dato k="Motivo de consulta inicial" v={child.referralReason} bloque />
          </div>
        </SeccionDoc>

        <SeccionDoc
          titulo="Evaluaciones iniciales"
          nota="Por especialidad: fecha, especialista, instrumentos aplicados y hallazgos principales."
        >
          <TablaDoc
            vacio="No hay evaluaciones ni anamnesis registradas para este paciente."
            columnas={[
              { clave: "date", titulo: "Fecha", celda: (d) => (d.date ? fmtDateShort(d.date) : "—") },
              { clave: "type", titulo: "Tipo", celda: (d) => (d.type === "anamnesis" ? "Anamnesis" : "Evaluación") },
              { clave: "title", titulo: "Título", celda: (d) => d.title || "—" },
              { clave: "author", titulo: "Especialista", celda: (d) => users.find((u) => u.id === d.authorId)?.name || "—" },
              { clave: "notes", titulo: "Hallazgos", celda: (d) => d.notes || "—" },
            ]}
            filas={evaluaciones}
          />
        </SeccionDoc>

        <SeccionDoc
          titulo="Línea de tiempo de planes de tratamiento"
          nota="Cada disciplina con su fecha de inicio, especialistas y objetivos con escala GAS."
        >
          {planes.length === 0 ? (
            <SinDato>Este paciente todavía no tiene objetivos definidos, así que no hay plan que documentar.</SinDato>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {planes.map((p) => (
                <div key={p.area} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <b style={{ fontSize: 12.5, color: T.brand }}>{p.area}</b>
                    <span style={{ fontSize: 11, color: T.inkSoft }}>
                      {p.inicio ? `Inicio ${fmtDateShort(p.inicio)}` : "Sin fecha de inicio"}
                      {p.especialistas.length > 0 && ` · ${p.especialistas.join(", ")}`}
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {p.objetivos.map((o) => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "3px 0", fontSize: 11.5 }}>
                        <span>{o.name}</span>
                        <EscalaGas base={o.gasBaseline} meta={o.gasTarget} actual={o.gasCurrent} ancho={130} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Especialistas involucrados">
          <TablaDoc
            vacio="Sin especialistas asignados ni sesiones registradas."
            columnas={[
              { clave: "nombre", titulo: "Nombre" },
              { clave: "especialidad", titulo: "Especialidad" },
              { clave: "periodo", titulo: "Período de atención", celda: (e) =>
                e.desde ? `${fmtDateShort(e.desde)} — ${fmtDateShort(e.hasta)}` : "Sin sesiones registradas" },
              { clave: "sesiones", titulo: "Sesiones", alinear: "right" },
            ]}
            filas={equipo}
          />
        </SeccionDoc>

        <SeccionDoc titulo="Métricas de asistencia global">
          {asistencia.programadas === 0 ? (
            <SinDato>No hay sesiones registradas en el rango seleccionado.</SinDato>
          ) : (
            <ListaDoc items={[
              `${contar(asistencia.programadas, "sesión programada", "sesiones programadas")}, ${asistencia.asistidas} asistida${asistencia.asistidas === 1 ? "" : "s"}.`,
              `${contar(asistencia.ausencias, "ausencia", "ausencias")} y ${contar(asistencia.canceladas, "cancelación", "cancelaciones")}.`,
              `${contar(asistencia.reprogramadas, "sesión reprogramada", "sesiones reprogramadas")}.`,
              asistencia.porcentaje != null
                ? `Asistencia histórica: ${asistencia.porcentaje}% (las reprogramadas no cuentan como falta).`
                : "Sin base suficiente para calcular el porcentaje.",
            ]} />
          )}
        </SeccionDoc>

        {conBitacora && (
          <SeccionDoc
            titulo="Bitácora de sesiones"
            nota={`${contar(sesiones.length, "sesión", "sesiones")} en el rango seleccionado.`}
          >
            <TablaDoc
              vacio="No hay sesiones en el rango seleccionado."
              columnas={[
                { clave: "date", titulo: "Fecha", celda: (s) => fmtDateShort(s.date) },
                { clave: "specialty", titulo: "Disciplina", celda: (s) => s.specialty || "—" },
                { clave: "specialist", titulo: "Especialista", celda: (s) => users.find((u) => u.id === s.specialistId)?.name || "—" },
                { clave: "attendance", titulo: "Asistencia", celda: (s) =>
                  ASISTENCIA[s.attendance || "asistio"]?.label || s.attendance },
                { clave: "duration", titulo: "Duración", alinear: "right", celda: (s) => (s.duration ? `${s.duration}′` : "—") },
              ]}
              filas={[...sesiones].reverse()}
            />
          </SeccionDoc>
        )}

        <SeccionDoc titulo="Reportes de evolución compilados">
          <TablaDoc
            vacio="Todavía no se ha guardado ningún reporte de evolución en el expediente."
            columnas={[
              { clave: "generatedDate", titulo: "Emitido", celda: (r) => fmtDateShort(r.generatedDate) },
              { clave: "specialty", titulo: "Especialidad", celda: (r) => r.specialty || "Todas" },
              { clave: "periodo", titulo: "Período", celda: (r) => `${fmtDateShort(r.fromDate)} — ${fmtDateShort(r.toDate)}` },
              { clave: "specialist", titulo: "Especialista", celda: (r) => users.find((u) => u.id === r.specialistId)?.name || "—" },
              { clave: "resumen", titulo: "Resumen", celda: (r) => {
                const c = r.content || {};
                const n = c.objetivos?.length || 0;
                const l = c.logros?.length || 0;
                return `${n} objetivo${n === 1 ? "" : "s"}, ${l} logro${l === 1 ? "" : "s"}`;
              } },
            ]}
            filas={reportesEvolucion}
          />
        </SeccionDoc>

        <SeccionDoc
          titulo="Comunicación relevante con la familia"
          nota="Reuniones y acuerdos. No incluye el detalle de mensajería."
        >
          <TablaDoc
            vacio="No hay reuniones registradas con la familia."
            columnas={[
              { clave: "date", titulo: "Fecha", celda: (m) => (m.date ? fmtDateShort(m.date) : "—") },
              { clave: "type", titulo: "Tipo", celda: (m) => m.type || "—" },
              { clave: "participants", titulo: "Participantes", celda: (m) => m.participants || "—" },
              { clave: "agreements", titulo: "Acuerdos", celda: (m) => m.agreements || m.summary || "—" },
            ]}
            filas={reunionesDelNino}
          />
          {reportesPadres.length > 0 && (
            <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 8 }}>
              Se han enviado {reportesPadres.length} reporte{reportesPadres.length === 1 ? "" : "s"} a la
              familia; el último el {fmtDateShort(reportesPadres[0].generatedDate)}.
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Estado actual">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "8px 20px" }}>
            <Dato k="Estado" v={estadoDelPaciente(child)} />
            <Dato k="Fecha de alta" v={child.dischargeDate ? fmtDate(child.dischargeDate) : null} />
          </div>
          {child.dischargeReason && (
            <div style={{ marginTop: 8 }}>
              <Dato k="Motivo del alta y seguimiento" v={child.dischargeReason} bloque />
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Validación">
          <div style={{ fontSize: 11.5, color: T.inkSoft }}>
            Generado por <b style={{ color: T.ink }}>{nombreUsuario || "—"}</b> el {fmtDate(TODAY)}.
            Cuando este historial se emita con fines de traspaso o legales requiere
            además la aprobación de Dirección Clínica.
          </div>
          <div style={{ borderBottom: `1px solid ${T.ink}`, height: 30, maxWidth: 280, marginTop: 16 }} />
          <div style={{ fontSize: 9.5, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: 3 }}>
            Dirección Clínica — firma y fecha
          </div>
        </SeccionDoc>
      </DocumentoAira>
    </VisorReporte>
  );
}

function Dato({ k, v, bloque }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {k}
      </div>
      <div style={{
        fontSize: 12, marginTop: 1,
        color: v ? T.ink : T.inkFaint, fontStyle: v ? "normal" : "italic",
        whiteSpace: bloque ? "pre-wrap" : "normal",
      }}>
        {v || "Sin registrar"}
      </div>
    </div>
  );
}
