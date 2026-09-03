import React, { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import { T, TODAY } from "../../theme.js";
import { sessionsSinceLastParentReport, buildParentReportText } from "../../lib/reports.js";
import { Btn, Modal, ModalHeader, DateRangeBar } from "../../ui/index.js";

function ParentReportModal({ child, sessions, objectives, parentReports, onClose, onGenerated }) {
  const sinceLastSessions = useMemo(
    () => sessionsSinceLastParentReport(child.id, sessions, parentReports).sort((a, b) => a.date.localeCompare(b.date)),
    [child.id, sessions, parentReports]
  );
  const defaultFrom = sinceLastSessions[0]?.date || child.admissionDate;
  const [fromDate, setFromDate] = useState(defaultFrom);
  const rangeSessions = sessions.filter((s) => s.childId === child.id && s.date >= fromDate).sort((a, b) => a.date.localeCompare(b.date));
  const presets = [
    { label: "Desde el último reporte", value: defaultFrom },
    { label: "Últimas 8 sesiones", value: sessions.filter((s) => s.childId === child.id).sort((a, b) => b.date.localeCompare(a.date))[7]?.date || child.admissionDate },
    { label: "Desde el ingreso", value: child.admissionDate },
  ];

  const reportText = useMemo(() => buildParentReportText(child, rangeSessions, objectives), [child, rangeSessions, objectives]);
  const contact = child.parentContact || {};

  function handleSend(channel) {
    if (channel === "email") {
      const subject = encodeURIComponent(`Reporte de progreso — ${child.name} ${child.lastName}`);
      const body = encodeURIComponent(reportText);
      window.open(`mailto:${contact.email || ""}?subject=${subject}&body=${body}`, "_blank");
    } else {
      const text = encodeURIComponent(reportText);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
    onGenerated({ childId: child.id, generatedDate: TODAY, fromDate, toDate: TODAY, sessionCount: rangeSessions.length });
  }

  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader title="Reporte para padres" subtitle={`${child.name} ${child.lastName} · ${rangeSessions.length} sesión(es) en el periodo`} onClose={onClose} />
      <DateRangeBar fromDate={fromDate} setFromDate={setFromDate} minDate={child.admissionDate} presets={presets} />
      <div style={{ padding: 24, maxHeight: "50vh", overflowY: "auto" }}>
        {rangeSessions.length === 0 ? (
          <div style={{ color: T.inkFaint, textAlign: "center", padding: 30 }}>No hay sesiones en el rango seleccionado.</div>
        ) : (
          <div style={{
            background: T.surfaceSunk, borderRadius: 14, padding: 18, fontSize: 13.5,
            color: T.ink, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif",
          }}>
            {reportText}
          </div>
        )}
        {contact.name && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: T.inkSoft }}>
            Se enviará a <b>{contact.name}</b> {contact.email ? `· ${contact.email}` : ""} {contact.phone ? `· ${contact.phone}` : ""}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimir</Btn>
        <Btn variant="ghost" onClick={() => handleSend("email")}>Enviar por correo</Btn>
        <Btn variant="amber" onClick={() => handleSend("whatsapp")}>Enviar por WhatsApp</Btn>
      </div>
    </Modal>
  );
}

export default ParentReportModal;
