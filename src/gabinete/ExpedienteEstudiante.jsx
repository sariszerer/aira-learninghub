import React, { useMemo, useState } from "react";
import { ArrowLeft, FileText, Paperclip, Plus, User } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate, contar } from "../lib/format.js";
import { can } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Avatar, Btn, Card, Eyebrow } from "../ui/index.js";
import { FORMATOS_TUTOR } from "./formatosTutor.js";
import { RESULTADOS, RUTAS, faltaExpediente, tonoDe } from "./preescolar.js";
import TamizajeModal from "./TamizajeModal.jsx";
import { AlertTriangle, Stethoscope } from "lucide-react";
import FormatoTutorModal from "./FormatoTutorModal.jsx";

// Expediente de un estudiante dentro del gabinete externo.
//
// Los tres documentos del programa de tutoria son fijos y siempre se muestran,
// tengan contenido o no: son los que la clinica espera encontrar, y una lista
// que solo enseña lo ya creado no dice cual falta.

const ORDEN = ["plan_trabajo_tutor", "supervision", "tutor_quincenal"];
// En preescolar el plan de trabajo y el seguimiento sustituyen a los formatos
// de tutoria: es otro programa, no el mismo con otro nombre.
const ORDEN_PREESCOLAR = ["plan_preescolar", "seguimiento_caso", "informe_familia"];

export default function ExpedienteEstudiante({ estudiante, onVolver, programa = "tutoria" }) {
  const documents = useDataStore((s) => s.documents);
  const tutores = useDataStore((s) => s.tutores);
  const children = useDataStore((s) => s.children);
  const agregarDocumento = useDataStore((s) => s.agregarDocumentoDeEstudiante);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [creando, setCreando] = useState(null);
  const [tamizando, setTamizando] = useState(false);
  const [abriendo, setAbriendo] = useState(false);
  const tamizajes = useDataStore((s) => s.tamizajes);
  const abrirExpediente = useDataStore((s) => s.abrirExpedienteDeEstudiante);
  const esPreescolar = programa === "preescolar";
  const suyosTamizajes = useMemo(
    () => tamizajes.filter((t) => t.studentId === estudiante.id)
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
    [tamizajes, estudiante.id]
  );

  const tutor = tutores.find((t) => t.id === estudiante.tutorId) || null;
  const paciente = children.find((c) => c.id === estudiante.childId) || null;
  const puedeEscribir = can(currentUser, "gabinete:session:create");

  const suyos = useMemo(
    () => documents.filter((d) => d.studentId === estudiante.id),
    [documents, estudiante.id]
  );

  return (
    <div>
      <button
        onClick={onVolver}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none",
          border: "none", cursor: "pointer", padding: "0 0 14px",
          fontFamily: T.font, fontSize: 13, color: T.brand, fontWeight: 600,
        }}
      >
        <ArrowLeft size={15} /> Volver al colegio
      </button>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Avatar name={`${estudiante.name} ${estudiante.lastName || ""}`} bg={T.brand} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.ink }}>
              {estudiante.name} {estudiante.lastName || ""}
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
              {[esPreescolar ? estudiante.nivel : estudiante.grade,
                estudiante.startDate && `desde ${fmtDate(estudiante.startDate)}`]
                .filter(Boolean).join(" · ") || (esPreescolar ? "Sin nivel asignado" : "Sin grado registrado")}
            </div>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginTop: 16,
        }}>
          {!esPreescolar && (
            <Dato etiqueta="Tutora asignada" icono={User}>
              {tutor
                ? tutor.name
                : <span style={{ color: T.inkFaint, fontStyle: "italic" }}>Sin asignar</span>}
            </Dato>
          )}
          <Dato etiqueta="Expediente clínico">
            {paciente
              ? <span style={{ color: T.brand }}>{paciente.name} {paciente.lastName}</span>
              : <span style={{ color: T.inkFaint, fontStyle: "italic" }}>No es paciente de AIRA</span>}
          </Dato>
          {esPreescolar ? (
            <Dato etiqueta="Ruta del caso">
              <span style={{ color: tonoDe((RUTAS[estudiante.ruta] || RUTAS.sin_evaluar).tono, T).color }}>
                {(RUTAS[estudiante.ruta] || RUTAS.sin_evaluar).label}
              </span>
            </Dato>
          ) : (
            <Dato etiqueta="Documentos">{contar(suyos.length, "documento", "documentos")}</Dato>
          )}
        </div>

        {estudiante.notas && (
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 14, lineHeight: 1.6 }}>
            {estudiante.notas}
          </div>
        )}
      </Card>

      {esPreescolar && (
        <>
          {faltaExpediente(estudiante) && (
            <Card style={{
              marginBottom: 18, padding: "14px 16px",
              background: T.apoyoTint, border: `1px solid ${T.apoyo}33`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <AlertTriangle size={17} color={T.apoyo} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.apoyo }}>
                    Derivado al centro y sin expediente clínico
                  </div>
                  <div style={{ fontSize: 12.5, color: T.ink, marginTop: 3, lineHeight: 1.5 }}>
                    Se decidió que necesita atención en el centro. Ábrele el expediente
                    para poder registrarle sesiones, objetivos y reportes.
                  </div>
                </div>
                {puedeEscribir && (
                  <Btn
                    size="sm" icon={Stethoscope} disabled={abriendo}
                    onClick={async () => {
                      setAbriendo(true);
                      try { await abrirExpediente(estudiante.id); }
                      finally { setAbriendo(false); }
                    }}
                  >
                    {abriendo ? "Abriendo…" : "Abrir expediente"}
                  </Btn>
                )}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
            <Eyebrow>Tamizaje y resultados</Eyebrow>
            {puedeEscribir && (
              <Btn size="sm" variant="secondary" icon={Plus} onClick={() => setTamizando(true)}>Registrar tamizaje</Btn>
            )}
          </div>

          {suyosTamizajes.length === 0 ? (
            <Card style={{ padding: "20px", textAlign: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: T.inkFaint }}>
                Todavía no se le ha aplicado ningún tamizaje.
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {suyosTamizajes.map((t) => {
                const r = RESULTADOS[t.resultado] || RESULTADOS.pendiente;
                const tono = tonoDe(r.tono, T);
                return (
                  <Card key={t.id} style={{ padding: "13px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {fmtDate(t.fecha)}
                        {t.instrumento && <span style={{ color: T.inkSoft, fontWeight: 400 }}> · {t.instrumento}</span>}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                        background: tono.fondo, color: tono.color,
                      }}>
                        {r.label}
                      </span>
                    </div>
                    {t.areasAlerta?.length > 0 && (
                      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 7 }}>
                        <b style={{ color: T.ink }}>Áreas de alerta:</b> {t.areasAlerta.join(", ")}
                      </div>
                    )}
                    {t.observaciones && (
                      <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>{t.observaciones}</div>
                    )}
                    {t.recomendacion && (
                      <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6, color: T.inkSoft }}>
                        <b style={{ color: T.ink }}>Recomendación:</b> {t.recomendacion}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Eyebrow style={{ marginBottom: 12 }}>Expediente</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(esPreescolar ? ORDEN_PREESCOLAR : ORDEN).map((tipo) => {
          const formato = FORMATOS_TUTOR[tipo];
          const suyosDelTipo = suyos
            .filter((d) => d.type === tipo)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          return (
            <Card key={tipo} style={{ padding: "15px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <FileText size={16} color={T.brand} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{formato.titulo}</div>
                    <div style={{ fontSize: 11.5, color: T.inkFaint }}>
                      {suyosDelTipo.length
                        ? `${contar(suyosDelTipo.length, "registro", "registros")} · último el ${fmtDate(suyosDelTipo[0].date)}`
                        : "Ninguno todavía"}
                    </div>
                  </div>
                </div>
                {puedeEscribir && (
                  <Btn size="sm" variant="secondary" icon={Plus} onClick={() => setCreando(tipo)}>Nuevo</Btn>
                )}
              </div>

              {suyosDelTipo.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {suyosDelTipo.map((d) => (
                    <div key={d.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, padding: "7px 10px", background: T.surfaceSunk, borderRadius: 7,
                      fontSize: 12.5,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        {d.fields?.modo === "pdf" && <Paperclip size={12} color={T.inkFaint} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.fields?.modo === "pdf" ? (d.fields.pdfNombre || "PDF adjunto") : "Formato llenado"}
                        </span>
                      </span>
                      <span style={{ color: T.inkFaint, whiteSpace: "nowrap" }}>{fmtDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {tamizando && (
        <TamizajeModal estudiante={estudiante} onClose={() => setTamizando(false)} />
      )}

      {creando && (
        <FormatoTutorModal
          tipo={creando}
          estudiante={estudiante}
          tutor={tutor}
          onClose={() => setCreando(null)}
          onGuardar={(doc) => agregarDocumento(estudiante.id, doc)}
        />
      )}
    </div>
  );
}

function Dato({ etiqueta, icono: Icono, children }) {
  return (
    <div style={{ background: T.surfaceSunk, borderRadius: 9, padding: "10px 12px" }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
      }}>
        {etiqueta}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: T.ink }}>
        {Icono && <Icono size={13} color={T.inkFaint} />}
        {children}
      </div>
    </div>
  );
}
