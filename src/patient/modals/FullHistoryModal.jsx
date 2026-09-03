import React, { useState } from "react";
import { Printer, Filter } from "lucide-react";
import { T } from "../../theme.js";
import { fmtDate, daysAgoISO } from "../../lib/format.js";
import { Eyebrow, Btn, Chip, Modal, ModalHeader, Field, Section, DateRangeBar } from "../../ui/index.js";
import ObjectivesList from "../tabs/ObjetivosTab.jsx";
import DailyReport from "./DailyReport.jsx";

function FullHistoryModal({ child, sessions, objectives, users, onClose }) {
  const [filterSpecialty, setFilterSpecialty] = useState("Todas");
  const [fromDate, setFromDate] = useState(child.admissionDate || "2025-01-01");
  const presets = [
    { label: "Desde el ingreso", value: child.admissionDate },
    { label: "Últimos 30 días", value: daysAgoISO(30) },
    { label: "Últimos 90 días", value: daysAgoISO(90) },
  ];
  const childSessions = sessions
    .filter((s) => s.childId === child.id && s.date >= fromDate)
    .filter((s) => filterSpecialty === "Todas" || s.specialty === filterSpecialty)
    .sort((a, b) => b.date.localeCompare(a.date));
  const childObjectives = objectives.filter((o) => o.childId === child.id);
  const specialistsInvolved = child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <Modal onClose={onClose} width={680}>
      <ModalHeader title="Historial completo" subtitle={`${child.name} ${child.lastName}`} onClose={onClose} />
      <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <Filter size={14} color={T.inkFaint} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Todas", ...child.specialties].map((sp) => (
            <Chip key={sp} label={sp} selected={filterSpecialty === sp} onClick={() => setFilterSpecialty(sp)} />
          ))}
        </div>
      </div>
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "56vh", overflowY: "auto" }}>
        <Section title="Información del paciente">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
            <Field label="Nombre" value={`${child.name} ${child.lastName}`} />
            <Field label="Edad" value={child.age != null ? `${child.age} años` : "Pendiente"} />
            <Field label="Fecha de nacimiento" value={child.birthDate ? fmtDate(child.birthDate) : "Pendiente"} />
            <Field label="Fecha de ingreso" value={child.admissionDate ? fmtDate(child.admissionDate) : "Pendiente"} />
            <Field label="Especialidades" value={child.specialties.join(", ")} />
            <Field label="Especialistas" value={specialistsInvolved.map((s) => s.name).join(", ")} />
          </div>
        </Section>

        <Section title="Objetivos">
          <ObjectivesList objectives={childObjectives} compact />
        </Section>

        <Eyebrow style={{ marginBottom: 14 }}>
          Historial cronológico ({childSessions.length} sesión{childSessions.length !== 1 ? "es" : ""})
        </Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {childSessions.map((s) => {
            const specialist = users.find((u) => u.id === s.specialistId);
            return (
              <div key={s.id} style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep }}>{fmtDate(s.date)} — {s.specialty}</div>
                <DailyReport session={s} child={child} specialist={specialist} objectives={objectives} printable />
              </div>
            );
          })}
          {childSessions.length === 0 && <div style={{ color: T.inkFaint, textAlign: "center", padding: 20 }}>No hay sesiones para este filtro.</div>}
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir / Exportar</Btn>
      </div>
    </Modal>
  );
}

export default FullHistoryModal;
