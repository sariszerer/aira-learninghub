import React from "react";
import { Sparkles } from "lucide-react";
import { T } from "../../theme.js";
import { fmtDate } from "../../lib/format.js";
import { StatusPill, Modal, ModalHeader, Field, Section } from "../../ui/index.js";

function DailyReport({ session, child, specialist, objectives, printable }) {
  const worked = session.objectivesWorked.map((ow) => ({
    ...ow,
    objective: objectives.find((o) => o.id === ow.objectiveId),
  })).filter((w) => w.objective);

  return (
    <div style={{ fontFamily: T.font }}>
      {!printable && (
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: T.amberDeep, background: T.amberTint,
          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
          borderRadius: 999, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          <Sparkles size={12} /> Generado automáticamente
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", marginBottom: 20 }}>
        <Field label="Paciente" value={`${child.name} ${child.lastName}`} />
        <Field label="Fecha" value={fmtDate(session.date)} />
        <Field label="Especialista" value={specialist?.name || "—"} />
        <Field label="Especialidad" value={session.specialty} />
      </div>

      <Section title="Objetivos trabajados">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {worked.map((w) => (
            <span key={w.objectiveId} style={{
              fontSize: 13, fontWeight: 600, color: T.brand, background: T.brandTint,
              padding: "5px 11px", borderRadius: 999,
            }}>{w.objective.name}</span>
          ))}
        </div>
      </Section>

      <Section title="Actividades realizadas">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {session.activities.map((a) => (
            <span key={a} style={{
              fontSize: 13, fontWeight: 600, color: T.inkSoft, background: T.surfaceSunk,
              padding: "5px 11px", borderRadius: 999,
            }}>{a}</span>
          ))}
        </div>
      </Section>

      <Section title="Desempeño">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {worked.map((w) => (
            <div key={w.objectiveId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: T.ink }}>{w.objective.name}</span>
              <StatusPill status={w.status} />
            </div>
          ))}
        </div>
      </Section>

      {session.observation && (
        <Section title="Observaciones">
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0 }}>{session.observation}</p>
        </Section>
      )}

      {session.nextSteps && (
        <Section title="Continuar trabajando" last>
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{session.nextSteps}</p>
        </Section>
      )}
    </div>
  );
}

function DailyReportModal({ session, child, specialist, objectives, onClose }) {
  return (
    <Modal onClose={onClose} width={600}>
      <ModalHeader title="Reporte diario" subtitle={fmtDate(session.date)} onClose={onClose} />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
        <DailyReport session={session} child={child} specialist={specialist} objectives={objectives} />
      </div>
    </Modal>
  );
}

export default DailyReport;
export { DailyReportModal };
