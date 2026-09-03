import React, { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import { T } from "../../theme.js";
import { fmtDate, fmtDateShort, daysAgoISO } from "../../lib/format.js";
import { Btn, Modal, ModalHeader, Section, EmptyNote, DateRangeBar } from "../../ui/index.js";
import ObjectivesList from "../tabs/ObjetivosTab.jsx";

function EvolutionReportModal({ child, sessions, objectives, users, onClose }) {
  const [fromDate, setFromDate] = useState(child.admissionDate || "2025-01-01");
  const childSessions = sessions.filter((s) => s.childId === child.id && s.date >= fromDate);
  const childObjectives = objectives.filter((o) => o.childId === child.id);

  const presets = [
    { label: "Desde el ingreso", value: child.admissionDate },
    { label: "Últimos 30 días", value: daysAgoISO(30) },
    { label: "Últimos 90 días", value: daysAgoISO(90) },
  ];

  const analysis = useMemo(() => {
    return childObjectives.map((obj) => {
      const entries = childSessions
        .flatMap((s) => s.objectivesWorked.filter((ow) => ow.objectiveId === obj.id).map((ow) => ({ ...ow, session: s })))
        .sort((a, b) => a.session.date.localeCompare(b.session.date));
      return { objective: obj, entries, timesWorked: entries.length, currentStatus: obj.status };
    });
  }, [childObjectives, childSessions]);

  const logrados = analysis.filter((a) => a.currentStatus === "logrado");
  const enProceso = analysis.filter((a) => a.currentStatus === "proceso");
  const necesitanApoyo = analysis.filter((a) => a.currentStatus === "apoyo");
  const recommendations = Array.from(new Set(childSessions.map((s) => s.nextSteps).filter(Boolean)));
  const observationsWithFriction = childSessions.filter((s) => /frustra|dificult|distrae|apoyo|costó/i.test(s.observation || ""));

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHeader title="Reporte de evolución" subtitle={`${child.name} ${child.lastName} · basado en ${childSessions.length} sesión(es) desde ${fmtDate(fromDate)}`} onClose={onClose} />
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "62vh", overflowY: "auto" }}>
        {childSessions.length === 0 ? (
          <div style={{ color: T.inkFaint, textAlign: "center", padding: 30 }}>
            No hay sesiones registradas en el rango de fechas seleccionado.
          </div>
        ) : (
          <>
            <Section title="Objetivos trabajados">
              <div style={{ fontSize: 14, color: T.ink }}>{analysis.length} objetivo(s), trabajados en {childSessions.length} sesión(es) en total.</div>
            </Section>

            <Section title={`Objetivos logrados (${logrados.length})`}>
              {logrados.length ? <ObjectivesList objectives={logrados.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo marcado como logrado todavía." />}
            </Section>

            <Section title={`En proceso (${enProceso.length})`}>
              {enProceso.length ? <ObjectivesList objectives={enProceso.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo en proceso." />}
            </Section>

            <Section title={`Necesitan apoyo (${necesitanApoyo.length})`}>
              {necesitanApoyo.length ? <ObjectivesList objectives={necesitanApoyo.map((a) => a.objective)} compact /> : <EmptyNote text="Ningún objetivo marcado como necesita apoyo." />}
            </Section>

            <Section title="Dificultades frecuentes observadas">
              {observationsWithFriction.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {observationsWithFriction.map((s) => (
                    <div key={s.id} style={{ fontSize: 13.5, color: T.ink, background: T.apoyoTint, padding: "9px 12px", borderRadius: 10 }}>
                      <span style={{ color: T.apoyo, fontWeight: 700 }}>{fmtDateShort(s.date)}: </span>{s.observation}
                    </div>
                  ))}
                </div>
              ) : <EmptyNote text="No se registraron dificultades relevantes en las observaciones." />}
            </Section>

            <Section title="Recomendaciones registradas" last>
              {recommendations.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: T.ink, lineHeight: 1.8 }}>
                  {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : <EmptyNote text="No hay recomendaciones registradas aún." />}
            </Section>

            <div style={{ fontSize: 12, color: T.inkFaint, fontStyle: "italic", marginTop: 4 }}>
              Este reporte se genera únicamente a partir de la información registrada por las especialistas. No incluye interpretaciones adicionales.
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

export default EvolutionReportModal;
