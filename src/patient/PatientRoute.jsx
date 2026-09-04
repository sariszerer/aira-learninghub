import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { SavedToast } from "../ui/index.js";
import { RouteLoading, RouteNotFound } from "../shell/index.js";
import { useDataStore } from "../store/dataStore.js";
import ChildProfile from "./ChildProfile.jsx";
import SessionWizard from "./modals/SessionWizard.jsx";
import { DailyReportModal } from "./modals/DailyReport.jsx";
import HistorialClinico from "../reports/HistorialClinico.jsx";
import ReporteEvolucion from "../reports/ReporteEvolucion.jsx";
import ReporteFamilia from "../reports/ReporteFamilia.jsx";
import { useAuthStore } from "../store/authStore.js";

// Contenedor de la ruta /paciente/:childId.
//
// Reune el estado efimero que solo esta pantalla usa: que modal esta abierto y
// si toca mostrar el aviso de guardado. Antes vivia en App(), que tenia que
// pasarlo hacia abajo por props; aqui esta junto a lo que lo consume.
export default function PatientRoute() {
  const { childId } = useParams();
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const objectives = useDataStore((s) => s.objectives);
  const sessions = useDataStore((s) => s.sessions);
  const parentReports = useDataStore((s) => s.parentReports);
  const dataLoaded = useDataStore((s) => s.dataLoaded);
  const saveSession = useDataStore((s) => s.saveSession);
  const addDocument = useDataStore((s) => s.addDocument);
  const addMeeting = useDataStore((s) => s.addMeeting);
  const addParentReport = useDataStore((s) => s.addParentReport);
  const documents = useDataStore((s) => s.documents);
  const meetings = useDataStore((s) => s.meetings);
  const evolutionReports = useDataStore((s) => s.evolutionReports);
  const guardarReporteEvolucion = useDataStore((s) => s.guardarReporteEvolucion);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [fullHistoryOpen, setFullHistoryOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [parentReportOpen, setParentReportOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const id = childId ? decodeURIComponent(childId) : null;
  const child = children.find((c) => c.id === id);

  // Se espera a que la primera carga termine antes de declarar "no encontrado":
  // `children` arranca con datos semilla y un enlace directo llegaria antes.
  if (!dataLoaded) return <RouteLoading />;
  if (!child) return <RouteNotFound />;

  // El store hace el trabajo de datos; cerrar el asistente y mostrar el aviso
  // son de la vista y se quedan aqui.
  const handleSaveSession = (payload) => {
    saveSession(payload);
    setWizardOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  };

  return (
    <>
      <ChildProfile
        child={child}
        onOpenSessionForm={() => setWizardOpen(true)}
        onViewReport={(s) => setViewingReport(s)}
        onGenerateFull={() => setFullHistoryOpen(true)}
        onGenerateEvolution={() => setEvolutionOpen(true)}
        onGenerateParentReport={() => setParentReportOpen(true)}
        onAddDocument={(doc) => addDocument(child.id, doc)}
        onAddMeeting={(meeting) => addMeeting(child.id, meeting)}
      />

      {wizardOpen && (
        <SessionWizard
          child={child} objectives={objectives}
          onClose={() => setWizardOpen(false)} onSave={handleSaveSession}
        />
      )}

      {viewingReport && (
        <DailyReportModal
          session={viewingReport} child={child}
          specialist={users.find((u) => u.id === viewingReport.specialistId)}
          objectives={objectives} onClose={() => setViewingReport(null)}
        />
      )}

      {fullHistoryOpen && (
        <HistorialClinico
          child={child} sessions={sessions} objectives={objectives} users={users}
          documents={documents} meetings={meetings} parentReports={parentReports}
          evolutionReports={evolutionReports} currentUser={currentUser}
          onClose={() => setFullHistoryOpen(false)}
        />
      )}

      {evolutionOpen && (
        <ReporteEvolucion
          child={child} sessions={sessions} objectives={objectives} users={users}
          currentUser={currentUser}
          onClose={() => setEvolutionOpen(false)}
          onGuardar={guardarReporteEvolucion}
        />
      )}

      {parentReportOpen && (
        <ReporteFamilia
          child={child} sessions={sessions} objectives={objectives} users={users}
          parentReports={parentReports} currentUser={currentUser}
          onClose={() => setParentReportOpen(false)}
          onGenerated={addParentReport}
        />
      )}

      {toast && <SavedToast />}
    </>
  );
}
