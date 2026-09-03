import React, { useState } from "react";
import { Users, FileText, TrendingUp } from "lucide-react";
import { T } from "../../theme.js";
import { DOC_TYPES } from "../../constants.js";
import { sessionsSinceLastParentReport } from "../../lib/reports.js";
import { ReportCard } from "../../ui/index.js";
import DocumentsSection from "../DocumentsSection.jsx";
import AddDocumentModal from "../modals/AddDocumentModal.jsx";

function ReportesTab({ child, documents, users, sessions, parentReports, currentUser, onAddDocument, onUpdateDocument, onGenerateFull, onGenerateEvolution, onGenerateParentReport }) {
  const [addingType, setAddingType] = useState(null);
  const sinceLast = sessionsSinceLastParentReport(child.id, sessions, parentReports);
  const readyForParentReport = sinceLast.length >= 8;
  // Only this child's documents — otherwise every patient's Reportes tab shows every other patient's evaluations/reports too.
  const childDocuments = documents.filter((d) => d.childId === child.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ReportCard
          icon={FileText} tone="brand" title="Historial completo"
          description="Documento cronológico con todas las sesiones, objetivos y observaciones registradas."
          action={onGenerateFull} actionLabel="Generar historial"
        />
        <ReportCard
          icon={TrendingUp} tone="amber" title="Reporte de evolución"
          description="Avances, dificultades frecuentes y recomendaciones, eligiendo desde qué fecha tomar la información."
          action={onGenerateEvolution} actionLabel="Generar evolución"
        />
        <ReportCard
          icon={Users} tone={readyForParentReport ? "amber" : "brand"} title="Reporte para padres"
          description="Resumen en lenguaje sencillo basado en los reportes diarios, listo para enviar por correo o WhatsApp."
          action={onGenerateParentReport} actionLabel="Generar reporte"
          badge={
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
              color: readyForParentReport ? T.amberDeep : T.inkSoft,
              background: readyForParentReport ? T.amberTint : T.surfaceSunk,
            }}>
              {sinceLast.length}/8 sesiones
            </span>
          }
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {Object.keys(DOC_TYPES).filter(type => type !== "anamnesis").map((type) => (
          <DocumentsSection key={type} type={type} documents={childDocuments} users={users}
            onAdd={() => setAddingType(type)} onUpdateDocument={onUpdateDocument} currentUser={currentUser} />
        ))}
      </div>

      {addingType && (
        <AddDocumentModal
          type={addingType}
          onClose={() => setAddingType(null)}
          onSave={(doc) => { onAddDocument({ ...doc, childId: child.id, authorId: currentUser.id }); setAddingType(null); }}
        />
      )}
    </div>
  );
}

export default ReportesTab;
