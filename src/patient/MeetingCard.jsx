import React from "react";
import { FileDown, Pencil } from "lucide-react";
import { T } from "../theme.js";
import { fmtDateShort } from "../lib/format.js";
import { Card, FieldLabel } from "../ui/index.js";
import { participantesDe, textoDeTipos } from "../lib/minuta.js";
import { textoAHtml, esHtml } from "../lib/textoRico.js";

function MeetingCard({ meeting, users, onAbrirPdf, onEditar }) {
  const author = users.find((u) => u.id === meeting.createdBy);
  const participantes = participantesDe(meeting.participants);
  // Los acuerdos viejos son texto con uno por linea y se pintan en
  // vinetas; los nuevos traen su propio formato y se pintan tal cual.
  const acuerdosPlanos = esHtml(meeting.agreements)
    ? null
    : String(meeting.agreements || "").split(/\r?\n/).map((a) => a.trim()).filter(Boolean);
  const hayAcuerdos = acuerdosPlanos
    ? acuerdosPlanos.length > 0
    : !!String(meeting.agreements || "").trim();

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep, letterSpacing: "0.04em" }}>
            {fmtDateShort(meeting.date)}
          </div>
          <div style={{ fontFamily: T.font, fontSize: 16.5, fontWeight: 600, color: T.ink, marginTop: 4 }}>
            {textoDeTipos(meeting.type)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.brand, background: T.brandTint, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
            Registrada por {author?.name.split(" ")[0] || "—"}
          </span>
          {/* Corregir una ya registrada. Sale del centro — va al colegio, al
              especialista externo — asi que un nombre mal escrito o un acuerdo
              que falta no es un detalle interno. */}
          {onEditar && (
            <button
              onClick={() => onEditar(meeting)}
              style={{
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                padding: "4px 10px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.surface, fontFamily: T.font, fontSize: 12,
                fontWeight: 600, color: T.inkSoft, whiteSpace: "nowrap",
              }}
            >
              <Pencil size={13} /> Editar
            </button>
          )}
          {onAbrirPdf && (
            <button
              onClick={() => onAbrirPdf(meeting)}
              style={{
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                padding: "4px 10px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.surface, fontFamily: T.font, fontSize: 12,
                fontWeight: 600, color: T.brand, whiteSpace: "nowrap",
              }}
            >
              <FileDown size={13} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Uno por línea. En una reunión de escuela con cinco personas y sus
          cargos, una sola línea con comas no se vuelve a leer. */}
      <div>
        <FieldLabel>Participantes</FieldLabel>
        {participantes.length === 0 ? (
          <div style={{ fontSize: 13.5, color: T.inkFaint }}>—</div>
        ) : (
          <ul style={{ margin: "2px 0 0", paddingLeft: 18, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            {participantes.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <FieldLabel>Resumen</FieldLabel>
        {/* textoAHtml limpia siempre, tambien lo ya guardado: en la base hay
            minutas escritas antes de que existiera la limpieza. */}
        <div
          style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: textoAHtml(meeting.summary) }}
        />
      </div>

      {hayAcuerdos && (
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Acuerdos</FieldLabel>
          {acuerdosPlanos ? (
            <ul style={{ margin: "2px 0 0", paddingLeft: 18, fontSize: 14, color: T.ink, lineHeight: 1.6, fontWeight: 600 }}>
              {acuerdosPlanos.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          ) : (
            <div
              style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, fontWeight: 600 }}
              dangerouslySetInnerHTML={{ __html: textoAHtml(meeting.agreements) }}
            />
          )}
        </div>
      )}
    </Card>
  );
}

export default MeetingCard;
