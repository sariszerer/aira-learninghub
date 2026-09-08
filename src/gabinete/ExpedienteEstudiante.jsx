import React, { useMemo, useState } from "react";
import { ArrowLeft, FileText, Paperclip, Plus, User } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate, contar } from "../lib/format.js";
import { can } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Avatar, Btn, Card, Eyebrow } from "../ui/index.js";
import { FORMATOS_TUTOR } from "./formatosTutor.js";
import FormatoTutorModal from "./FormatoTutorModal.jsx";

// Expediente de un estudiante dentro del gabinete externo.
//
// Los tres documentos del programa de tutoria son fijos y siempre se muestran,
// tengan contenido o no: son los que la clinica espera encontrar, y una lista
// que solo enseña lo ya creado no dice cual falta.

const ORDEN = ["plan_trabajo_tutor", "supervision", "tutor_quincenal"];

export default function ExpedienteEstudiante({ estudiante, onVolver }) {
  const documents = useDataStore((s) => s.documents);
  const tutores = useDataStore((s) => s.tutores);
  const children = useDataStore((s) => s.children);
  const agregarDocumento = useDataStore((s) => s.agregarDocumentoDeEstudiante);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [creando, setCreando] = useState(null);

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
              {[estudiante.grade, estudiante.startDate && `desde ${fmtDate(estudiante.startDate)}`]
                .filter(Boolean).join(" · ") || "Sin grado registrado"}
            </div>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginTop: 16,
        }}>
          <Dato etiqueta="Tutora asignada" icono={User}>
            {tutor
              ? tutor.name
              : <span style={{ color: T.inkFaint, fontStyle: "italic" }}>Sin asignar</span>}
          </Dato>
          <Dato etiqueta="Expediente clínico">
            {paciente
              ? <span style={{ color: T.brand }}>{paciente.name} {paciente.lastName}</span>
              : <span style={{ color: T.inkFaint, fontStyle: "italic" }}>No es paciente de AIRA</span>}
          </Dato>
          <Dato etiqueta="Documentos">{contar(suyos.length, "documento", "documentos")}</Dato>
        </div>

        {estudiante.notas && (
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 14, lineHeight: 1.6 }}>
            {estudiante.notas}
          </div>
        )}
      </Card>

      <Eyebrow style={{ marginBottom: 12 }}>Expediente</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ORDEN.map((tipo) => {
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
