import React, { useMemo, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { contar, fmtDate } from "../lib/format.js";
import {
  resumenAsistencia, progresoParaFamilia, logrosDestacados,
  sesionesEnRango, textoRango,
} from "../lib/reportes.js";
import { Btn } from "../ui/index.js";
import DocumentoAira, { CONTACTO_AIRA } from "./DocumentoAira.jsx";
import VisorReporte from "./VisorReporte.jsx";
import FiltrosReporte from "./FiltrosReporte.jsx";
import { SeccionDoc, SinDato, IndicadorFamilia, ListaDoc } from "./piezas.jsx";

// Reporte para Padres — seccion 3 de Formatos_Reportes_AIRA.docx.
//
// El documento trae una lista de "Que NO debe incluir" y aqui se cumple por
// construccion, no por cuidado al redactar:
//   · sin diagnosticos ni terminologia tecnica — no se muestran area clinica,
//     estado interno (logrado/proceso/apoyo) ni metodologia;
//   · sin comparaciones con otros ninos — nada del reporte mira a otro paciente;
//   · sin puntuaciones ni escalas sin traducir — el nivel GAS no se imprime
//     nunca, solo su traduccion a Logrado / En progreso / Iniciando.
//
// "Extension: 1-2 paginas". Por eso "Como le fue" se limita a cuatro objetivos
// y los logros a tres: es la diferencia entre algo que una familia lee y un
// volcado del expediente.

const MAX_OBJETIVOS = 4;
const MAX_LOGROS = 3;

export default function ReporteFamilia({
  child, sessions, objectives, users, parentReports, currentUser, onClose, onGenerated,
}) {
  const ultimoReporte = useMemo(() => {
    const mios = (parentReports || []).filter((r) => r.childId === child.id)
      .sort((a, b) => (b.toDate || "").localeCompare(a.toDate || ""));
    return mios[0] || null;
  }, [parentReports, child.id]);

  const [desde, setDesde] = useState(ultimoReporte?.toDate || child.admissionDate || "");
  const [hasta, setHasta] = useState(TODAY);
  const [enQueTrabajamos, setEnQueTrabajamos] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [proximosPasos, setProximosPasos] = useState("");

  const sesiones = useMemo(
    () => sesionesEnRango(sessions, child.id, desde, hasta),
    [sessions, child.id, desde, hasta]
  );

  const objetivos = useMemo(
    () => objectives.filter((o) => o.childId === child.id),
    [objectives, child.id]
  );

  // Los objetivos que de verdad se trabajaron en el periodo. Mostrar el plan
  // entero incluiria metas que la familia no vio moverse.
  const trabajados = useMemo(() => {
    const ids = new Set(sesiones.flatMap((s) => (s.objectivesWorked || []).map((ow) => ow.objectiveId)));
    const enPeriodo = objetivos.filter((o) => ids.has(o.id));
    return (enPeriodo.length ? enPeriodo : objetivos).slice(0, MAX_OBJETIVOS);
  }, [objetivos, sesiones]);

  const logros = useMemo(
    () => logrosDestacados(objetivos, sesiones).slice(0, MAX_LOGROS),
    [objetivos, sesiones]
  );

  const asistencia = useMemo(() => resumenAsistencia(sesiones), [sesiones]);
  const contacto = child.parentContact || {};
  const especialista = users.find((u) => u.id === currentUser?.id);

  // El texto plano para correo y WhatsApp se compone del mismo contenido que se
  // ve: dos redacciones distintas divergen a la primera correccion.
  const textoPlano = useMemo(() => {
    const l = [];
    l.push(`Reporte para la Familia — ${child.name} ${child.lastName}`);
    l.push(`${CONTACTO_AIRA.nombre} · ${textoRango(desde, hasta)}`);
    l.push("");
    l.push(contacto.name ? `Hola ${contacto.name}:` : "Hola:");
    l.push("");
    if (enQueTrabajamos.trim()) { l.push("En qué trabajamos este período:"); l.push(enQueTrabajamos.trim()); l.push(""); }
    if (trabajados.length) {
      l.push("Cómo le fue:");
      trabajados.forEach((o) => l.push(`• ${o.name} — ${progresoParaFamilia(o)}`));
      l.push("");
    }
    if (logros.length) {
      l.push("Logros para celebrar:");
      logros.forEach((o) => l.push(`• ${o.name}`));
      l.push("");
    }
    if (recomendaciones.trim()) { l.push("Recomendaciones para casa:"); l.push(recomendaciones.trim()); l.push(""); }
    if (proximosPasos.trim()) { l.push("Próximos pasos:"); l.push(proximosPasos.trim()); l.push(""); }
    if (asistencia.asistidas) l.push(`Gracias por acompañar el proceso: ${child.name} asistió a ${contar(asistencia.asistidas, "sesión", "sesiones")} en este período.`);
    l.push("");
    l.push("Cualquier duda, con gusto la conversamos en la próxima sesión.");
    l.push(`${CONTACTO_AIRA.nombre} · ${CONTACTO_AIRA.telefono} · ${CONTACTO_AIRA.correo}`);
    return l.join("\n");
  }, [child, desde, hasta, contacto.name, enQueTrabajamos, trabajados, logros, recomendaciones, proximosPasos, asistencia.asistidas]);

  const registrar = () => onGenerated?.({
    childId: child.id, generatedDate: TODAY,
    fromDate: desde || child.admissionDate || TODAY, toDate: hasta || TODAY,
    sessionCount: sesiones.length,
  });

  const enviar = (canal) => {
    if (canal === "email") {
      const asunto = encodeURIComponent(`Reporte de progreso — ${child.name} ${child.lastName}`);
      window.open(`mailto:${contacto.email || ""}?subject=${asunto}&body=${encodeURIComponent(textoPlano)}`, "_blank");
    } else {
      const tel = (contacto.phone || "").replace(/\D/g, "");
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(textoPlano)}`, "_blank");
    }
    registrar();
  };

  return (
    <VisorReporte
      titulo="Reporte para la Familia"
      onClose={onClose}
      acciones={
        <>
          <Btn variant="secondary" icon={Mail} onClick={() => enviar("email")}>Correo</Btn>
          <Btn variant="secondary" icon={MessageCircle} onClick={() => enviar("whatsapp")}>WhatsApp</Btn>
        </>
      }
    >
      <FiltrosReporte
        desde={desde} setDesde={setDesde}
        hasta={hasta} setHasta={setHasta}
        minDate={child.admissionDate}
        extra={
          <span style={{ fontSize: 11, color: T.inkFaint }}>
            {ultimoReporte
              ? `Último reporte enviado: ${fmtDate(ultimoReporte.generatedDate)}`
              : "Es el primer reporte para esta familia"}
          </span>
        }
      />

      <DocumentoAira
        titulo="Reporte para la Familia"
        subtitulo={`${child.name} ${child.lastName}`}
        meta={[
          { etiqueta: "Período", valor: textoRango(desde, hasta) },
          { etiqueta: "Especialidad", valor: (child.specialties || []).join(", ") },
          { etiqueta: "Especialista", valor: especialista?.name },
          { etiqueta: "Fecha", valor: fmtDate(TODAY) },
        ]}
      >
        <p style={{ fontSize: 13.5, margin: "0 0 16px" }}>
          {contacto.name ? `Hola ${contacto.name}:` : "Hola:"} queremos compartirles cómo
          ha ido {child.name} en este período.
        </p>

        <SeccionDoc titulo="¿En qué trabajamos este período?" omitirEnImpresion={!enQueTrabajamos.trim()}>
          <Redaccion
            valor={enQueTrabajamos} onChange={setEnQueTrabajamos}
            placeholder="En lenguaje sencillo y positivo: qué áreas y actividades se trabajaron..."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Cómo le fue">
          {trabajados.length === 0 ? (
            <SinDato>Todavía no hay objetivos definidos para compartir con la familia.</SinDato>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {trabajados.map((o) => (
                <div key={o.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 14, padding: "7px 11px", background: T.surfaceSunk,
                  borderRadius: 7, breakInside: "avoid",
                }}>
                  <span style={{ fontSize: 12.5 }}>{o.name}</span>
                  <IndicadorFamilia texto={progresoParaFamilia(o)} />
                </div>
              ))}
            </div>
          )}
        </SeccionDoc>

        <SeccionDoc titulo="Logros para celebrar">
          <ListaDoc
            items={logros.map((o) => o.name)}
            vacio="Seguimos trabajando: en el próximo reporte les contamos los avances."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Recomendaciones para casa" omitirEnImpresion={!recomendaciones.trim()}>
          <Redaccion
            valor={recomendaciones} onChange={setRecomendaciones}
            placeholder="De 3 a 5 sugerencias prácticas que la familia pueda aplicar..."
          />
        </SeccionDoc>

        <SeccionDoc titulo="Próximos pasos" omitirEnImpresion={!proximosPasos.trim()}>
          <Redaccion
            valor={proximosPasos} onChange={setProximosPasos}
            placeholder="En qué nos vamos a enfocar el siguiente período..."
          />
        </SeccionDoc>

        {asistencia.asistidas > 0 && (
          <SeccionDoc titulo="Asistencia">
            <p style={{ margin: 0, fontSize: 12.5 }}>
              Gracias por acompañar el proceso: {child.name} asistió
              a <b>{contar(asistencia.asistidas, "sesión", "sesiones")}</b> en
              este período. La constancia es buena parte del avance.
            </p>
          </SeccionDoc>
        )}

        <div style={{
          marginTop: 18, padding: "12px 14px", borderRadius: 8,
          background: T.brandTint, fontSize: 12.5, lineHeight: 1.6,
        }}>
          Si tienen cualquier duda sobre este reporte o quieren conversar sobre el
          proceso de {child.name}, escríbannos o coméntenlo en la próxima sesión.
          Nos encanta que nos pregunten.
        </div>
      </DocumentoAira>
    </VisorReporte>
  );
}

function Redaccion({ valor, onChange, placeholder }) {
  return (
    <>
      <textarea
        className="no-imprimir"
        value={valor} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", padding: "8px 10px",
          border: `1px dashed ${T.border}`, borderRadius: 6, resize: "vertical",
          fontFamily: T.font, fontSize: 12.5, lineHeight: 1.6, outline: "none",
          background: T.surfaceSunk, color: T.ink,
        }}
      />
      {valor.trim() && (
        <div className="solo-impresion" style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>{valor}</div>
      )}
    </>
  );
}
