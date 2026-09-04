import React, { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { contar, fmtDate, fmtDateShort } from "../lib/format.js";
import {
  resumenAsistencia, avancePorObjetivo, logrosDestacados, areasDeAtencion,
  sesionesEnRango, textoRango,
} from "../lib/reportes.js";
import { Btn } from "../ui/index.js";
import DocumentoAira from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import FiltrosReporte from "./FiltrosReporte.jsx";
import { SeccionDoc, SinDato, TablaDoc, EscalaGas, ListaDoc } from "./piezas.jsx";

// Reporte de Evolución — seccion 1 de Formatos_Reportes_AIRA.docx.
//
// "Actualizacion clinica periodica del avance de un paciente hacia los
// objetivos de su plan de tratamiento vigente, DENTRO DE UNA ESPECIALIDAD".
// Por eso el filtro de especialidad no es opcional en la practica: un reporte
// que mezcle OT con lenguaje no es el documento que se pidio. Se ofrece
// "Todas" solo para el caso de una sola disciplina activa.

export default function ReporteEvolucion({
  child, sessions, objectives, users, currentUser, onClose, onGuardar,
}) {
  const [desde, setDesde] = useState(child.admissionDate || "");
  const [hasta, setHasta] = useState(TODAY);
  const [especialidad, setEspecialidad] = useState(child.specialties?.[0] || "Todas");
  const [ajustes, setAjustes] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [guardado, setGuardado] = useState(false);

  const sesiones = useMemo(() => {
    const enRango = sesionesEnRango(sessions, child.id, desde, hasta);
    return especialidad === "Todas" ? enRango : enRango.filter((s) => s.specialty === especialidad);
  }, [sessions, child.id, desde, hasta, especialidad]);

  const objetivos = useMemo(() => {
    const delNino = objectives.filter((o) => o.childId === child.id);
    return especialidad === "Todas" ? delNino : delNino.filter((o) => o.area === especialidad);
  }, [objectives, child.id, especialidad]);

  const asistencia = useMemo(() => resumenAsistencia(sesiones), [sesiones]);
  const avances = useMemo(() => avancePorObjetivo(objetivos, sesiones), [objetivos, sesiones]);
  const logros = useMemo(() => logrosDestacados(objetivos, sesiones), [objetivos, sesiones]);
  const atencion = useMemo(() => areasDeAtencion(objetivos), [objetivos]);

  // "Especialista responsable": quien mas sesiones dio en el periodo y en esta
  // especialidad. Deducirlo de las sesiones y no de la lista de asignados evita
  // firmar el reporte con el nombre de alguien que no atendio en el corte.
  const responsable = useMemo(() => {
    const conteo = {};
    for (const s of sesiones) if (s.specialistId) conteo[s.specialistId] = (conteo[s.specialistId] || 0) + 1;
    const id = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0];
    return users.find((u) => u.id === id) || null;
  }, [sesiones, users]);

  const observacionesGenerales = useMemo(
    () => sesiones.filter((s) => (s.observation || "").trim()).slice(-6).reverse(),
    [sesiones]
  );

  const guardar = () => {
    onGuardar?.({
      childId: child.id,
      specialty: especialidad === "Todas" ? null : especialidad,
      specialistId: responsable?.id || null,
      fromDate: desde || child.admissionDate || TODAY,
      toDate: hasta || TODAY,
      generatedDate: TODAY,
      generatedBy: currentUser?.id || null,
      content: {
        asistencia,
        objetivos: avances.map((a) => ({
          nombre: a.objetivo.name, estado: a.objetivo.status,
          gas: a.gas, vecesTrabajado: a.vecesTrabajado,
        })),
        logros: logros.map((o) => o.name),
        areasDeAtencion: atencion.map((o) => o.name),
        ajustes, recomendaciones,
      },
    });
    setGuardado(true);
  };

  return (
    <VisorReporte
      titulo="Reporte de Evolución"
      onClose={onClose}
      acciones={onGuardar && (
        <Btn variant="secondary" icon={Save} onClick={guardar} disabled={guardado}>
          {guardado ? "Guardado" : "Guardar en el expediente"}
        </Btn>
      )}
    >
      <FiltrosReporte
        desde={desde} setDesde={setDesde}
        hasta={hasta} setHasta={setHasta}
        especialidad={especialidad} setEspecialidad={setEspecialidad}
        especialidades={child.specialties || []}
        minDate={child.admissionDate}
      />

      <DocumentoAira
        titulo="Reporte de Evolución"
        subtitulo={`${child.name} ${child.lastName}`}
        meta={[
          { etiqueta: "Expediente", valor: child.recordNo },
          { etiqueta: "Fecha de nacimiento", valor: child.birthDate ? fmtDate(child.birthDate) : null },
          { etiqueta: "Edad", valor: child.age != null ? `${child.age} años` : null },
          { etiqueta: "Especialidad", valor: especialidad === "Todas" ? (child.specialties || []).join(", ") : especialidad },
          { etiqueta: "Especialista responsable", valor: responsable?.name },
          { etiqueta: "Período cubierto", valor: textoRango(desde, hasta) },
          { etiqueta: "Fecha de emisión", valor: fmtDate(TODAY) },
        ]}
      >
        <SeccionDoc titulo="Resumen de asistencia">
          {asistencia.programadas === 0 ? (
            <SinDato>No hay sesiones registradas en el período seleccionado.</SinDato>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                ["Programadas", asistencia.programadas],
                ["Asistidas", asistencia.asistidas],
                ["Ausencias", asistencia.ausencias],
                ["Canceladas", asistencia.canceladas],
                ["Reprogramadas", asistencia.reprogramadas],
                ["% de asistencia", asistencia.porcentaje != null ? `${asistencia.porcentaje}%` : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  flex: "1 1 100px", padding: "8px 10px", borderRadius: 6,
                  background: T.surfaceSunk, minWidth: 92,
                }}>
                  <div style={{ fontSize: 9.5, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.brand }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc
          titulo="Objetivos vigentes"
          nota="Metas activas del plan de tratamiento, cada una con su escala GAS."
        >
          <TablaDoc
            vacio={especialidad === "Todas"
              ? "Este paciente todavía no tiene objetivos definidos."
              : `No hay objetivos definidos para ${especialidad}.`}
            columnas={[
              { clave: "name", titulo: "Objetivo", celda: (o) => o.name },
              { clave: "gas", titulo: "Escala GAS", celda: (o) => (
                <EscalaGas base={o.gasBaseline} meta={o.gasTarget} actual={o.gasCurrent} ancho={150} />
              ) },
            ]}
            filas={objetivos}
          />
        </SeccionDoc>

        <SeccionDoc
          titulo="Avance por objetivo"
          nota="Nivel actual frente a la línea base y la meta, con la evidencia clínica que lo respalda."
        >
          {avances.length === 0 ? (
            <SinDato>Sin objetivos que evaluar en este período.</SinDato>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {avances.map((a) => (
                <div key={a.objetivo.id} style={{
                  border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px",
                  breakInside: "avoid", pageBreakInside: "avoid",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.objetivo.name}</div>
                    <EscalaGas base={a.gas.base} meta={a.gas.meta} actual={a.gas.actual} />
                  </div>
                  <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4 }}>
                    Trabajado en {contar(a.vecesTrabajado, "sesión", "sesiones")} del período
                    {a.gas.alcanzada === true && " · meta alcanzada"}
                    {a.gas.alcanzada === false && " · meta aún no alcanzada"}
                  </div>
                  {a.objetivo.methodology && (
                    <div style={{ fontSize: 11.5, marginTop: 5 }}>
                      <b>Metodología:</b> {a.objetivo.methodology}
                    </div>
                  )}
                  {a.evidencia.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Evidencia
                      </div>
                      {a.evidencia.slice(-3).map((e, i) => (
                        <div key={i} style={{ fontSize: 11.5, marginTop: 2 }}>
                          <span style={{ color: T.brand, fontWeight: 600 }}>{fmtDateShort(e.fecha)}: </span>
                          {e.texto}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc
          titulo="Observaciones clínicas generales"
          nota="Participación, comportamiento y factores contextuales del período."
        >
          {observacionesGenerales.length === 0 ? (
            <SinDato>Sin observaciones registradas en las sesiones del período.</SinDato>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {observacionesGenerales.map((s) => (
                <div key={s.id} style={{ fontSize: 11.5, breakInside: "avoid" }}>
                  <span style={{ color: T.brand, fontWeight: 600 }}>{fmtDateShort(s.date)}: </span>
                  {s.observation}
                </div>
              ))}
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Logros destacados">
          <ListaDoc
            items={logros.map((o) => o.name)}
            vacio="No se registraron objetivos alcanzados en este período."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Áreas de atención" nota="Desafíos actuales o áreas donde el progreso es más lento.">
          <ListaDoc
            items={atencion.map((o) => o.name)}
            vacio="Ningún objetivo marcado como necesita apoyo."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Ajustes al plan" nota="Nuevos objetivos, frecuencia de sesiones o estrategias." omitirEnImpresion={!ajustes.trim()}>
          <CampoRedaccion
            valor={ajustes}
            onChange={setAjustes}
            placeholder="Cambios propuestos al plan de tratamiento para el siguiente ciclo..."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Recomendaciones para el siguiente período" omitirEnImpresion={!recomendaciones.trim()}>
          <CampoRedaccion
            valor={recomendaciones}
            onChange={setRecomendaciones}
            placeholder="Enfoque clínico sugerido para el próximo corte..."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Firma y validación">
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px",
            fontSize: 11.5, marginTop: 22,
          }}>
            <FirmaLinea etiqueta="Especialista" valor={responsable?.name} />
            <FirmaLinea etiqueta="Especialidad" valor={responsable?.specialty} />
            <FirmaLinea
              etiqueta="N° de idoneidad"
              valor={responsable?.licenseNo}
              faltante="Sin registrar en el perfil del especialista"
            />
            <FirmaLinea etiqueta="Fecha" valor={fmtDate(TODAY)} />
          </div>
        </SeccionDoc>
      </DocumentoAira>
    </VisorReporte>
  );
}

// Se escribe en un area con borde punteado, que al imprimir se sustituye por el
// texto plano: un recuadro de formulario dentro de un PDF firmado parece un
// documento sin terminar. Si esta vacio no se imprime nada, ni el hueco.
//
// La regla de visibilidad vive en la hoja de impresion del visor y no aqui: un
// <style> por instancia haria que la ultima pisara a todas las demas.
function CampoRedaccion({ valor, onChange, placeholder }) {
  return (
    <>
      <textarea
        className="no-imprimir"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", padding: "8px 10px",
          border: `1px dashed ${T.border}`, borderRadius: 6, resize: "vertical",
          fontFamily: T.font, fontSize: 12, lineHeight: 1.6, outline: "none",
          background: T.surfaceSunk, color: T.ink,
        }}
      />
      {valor.trim() && (
        <div className="solo-impresion" style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
          {valor}
        </div>
      )}
    </>
  );
}

function FirmaLinea({ etiqueta, valor, faltante }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ borderBottom: `1px solid ${T.ink}`, height: 18 }} />
      <div style={{ fontSize: 9.5, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: 3 }}>
        {etiqueta}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: valor ? T.ink : T.inkFaint, fontStyle: valor ? "normal" : "italic" }}>
        {valor || faltante || "—"}
      </div>
    </div>
  );
}
