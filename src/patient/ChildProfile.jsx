import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { T, SPECIALIST_COLORS, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { can } from "../permissions.js";
import { Avatar, Btn, Card } from "../ui/index.js";
import ResumenTab from "./tabs/ResumenTab.jsx";
import SesionesTab from "./tabs/SesionesTab.jsx";
import ObjetivosTab, { ObjectivesList } from "./tabs/ObjetivosTab.jsx";
import EditProfileModal from "./EditProfileModal.jsx";
import PlanTrabajoTab from "./tabs/PlanTrabajoTab.jsx";
import AnamnesisTab from "./tabs/AnamnesisTab.jsx";
import ReportesTab from "./tabs/ReportesTab.jsx";
import InterdisciplinaryTab from "./tabs/InterdisciplinaryTab.jsx";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";

// Tab ids double as the ?tab= URL slug, so they are module-level: the router needs
// to validate an incoming ?tab= value before ChildProfile renders.
const CHILD_TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "sesiones", label: "Sesiones" },
  { id: "objetivos", label: "Objetivos" },
  { id: "plan", label: "Plan de Trabajo" },
  { id: "anamnesis", label: "Anamnesis" },
  { id: "reportes", label: "Reportes" },
  { id: "interdisciplinario", label: "Interdisciplinario" },
];

const DEFAULT_CHILD_TAB = "resumen";

function ChildProfile({ child, onOpenSessionForm, onViewReport, onGenerateFull, onGenerateEvolution, onGenerateParentReport, onAddDocument, onAddMeeting }) {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const objectives = useDataStore((s) => s.objectives);
  const documents = useDataStore((s) => s.documents);
  const meetings = useDataStore((s) => s.meetings);
  const parentReports = useDataStore((s) => s.parentReports);
  const currentUser = useAuthStore((s) => s.currentUser);
  const onUpdateObjective = useDataStore((s) => s.updateObjective);
  const onAddObjective = useDataStore((s) => s.addObjective);
  const onDeleteObjective = useDataStore((s) => s.deleteObjective);
  const onRenewPackage = useDataStore((s) => s.renewPackage);
  const onUpdateChild = useDataStore((s) => s.updateChild);
  const onCloseProcess = useDataStore((s) => s.closeProcess);
  const onUpdateSession = useDataStore((s) => s.updateSession);
  const onUpdateDocument = useDataStore((s) => s.updateDocument);
  // Active tab lives in the URL (?tab=sesiones) so profile views are shareable.
  // An unknown or missing slug falls back to Resumen instead of rendering nothing.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = CHILD_TABS.some((t) => t.id === tabParam) ? tabParam : DEFAULT_CHILD_TAB;
  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    // Resumen is the default view, so it stays out of the URL.
    if (id === DEFAULT_CHILD_TAB) next.delete("tab");
    else next.set("tab", id);
    // replace: Back returns to the patient list rather than walking back through tabs.
    setSearchParams(next, { replace: true });
  };
  const [editingProfile, setEditingProfile] = useState(false);

  const specialistIdsFromSessions = [...new Set(
    sessions.filter(s => s.childId === child.id).map(s => s.specialistId).filter(Boolean)
  )];
  const specialists = specialistIdsFromSessions.length > 0
    ? specialistIdsFromSessions.map(id => users.find(u => u.id === id)).filter(Boolean)
    : child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const tabs = CHILD_TABS;

  return (
    <div className="aira-profile" style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 30 }}>
        <Avatar name={child.name + " " + child.lastName} bg={child.avatarBg} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
            {child.name} {child.lastName}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 7, fontSize: 13.5, color: T.inkSoft }}>
            {child.age != null && <span>{child.age} años</span>}
            {child.birthDate ? <span>Nació el {fmtDate(child.birthDate)}</span> : <span style={{color:T.muted}}>Fecha nacimiento pendiente</span>}
            {child.admissionDate ? <span>Ingresó el {fmtDate(child.admissionDate)}</span> : <span style={{color:T.muted}}>Fecha ingreso pendiente</span>}
          </div>
          <div style={{ fontSize: 13, color: T.inkFaint, marginTop: 8 }}>
            {child.specialties.join(" · ")}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {specialists.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={s.name} bg={SPECIALIST_COLORS[s.id] || s.avatarBg} size={22} />
                <span style={{ fontSize: 12.5, color: SPECIALIST_COLORS[s.id] || T.inkSoft, fontWeight: 500 }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {can(currentUser, "session:create") && child.assignedSpecialists.includes(currentUser.id) && (
            <Btn variant="amber" size="lg" icon={Plus} onClick={onOpenSessionForm}>Registrar sesión</Btn>
          )}
          {can(currentUser, "patient:edit") && (
            <Btn variant="secondary" size="sm" icon={Pencil} onClick={() => setEditingProfile(true)}>Editar perfil</Btn>
          )}
        </div>
      </div>

      {editingProfile && <EditProfileModal child={child} onClose={() => setEditingProfile(false)} />}

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 26 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "8px 2px",
            marginRight: 26, fontSize: 15.5, fontFamily: T.font,
            fontWeight: tab === t.id ? 600 : 500,
            color: tab === t.id ? T.brand : T.inkFaint,
            borderBottom: tab === t.id ? `2px solid ${T.brand}` : "2px solid transparent",
            transition: "color .15s ease",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab child={child} objectives={objectives} sessions={sessions} users={users} onRenewPackage={onRenewPackage} onCloseProcess={onCloseProcess} currentUser={currentUser} />}
      {tab === "sesiones" && <SesionesTab child={child} sessions={sessions} objectives={objectives} users={users} currentUser={currentUser} onUpdateSession={onUpdateSession} />}
      {tab === "objetivos" && <ObjetivosTab child={child} />}
      {tab === "plan" && <PlanTrabajoTab child={child} documents={documents} users={users} currentUser={currentUser} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} />}

      {tab === "anamnesis" && (
        <AnamnesisTab
          child={child} documents={documents} users={users} currentUser={currentUser}
          onAddDocument={onAddDocument}
        />
      )}
      {tab === "reportes" && (
        <ReportesTab
          child={child} documents={documents} users={users} sessions={sessions} parentReports={parentReports}
          currentUser={currentUser} onUpdateDocument={onUpdateDocument}
          onAddDocument={onAddDocument} onGenerateFull={onGenerateFull} onGenerateEvolution={onGenerateEvolution}
          onGenerateParentReport={onGenerateParentReport}
        />
      )}
      {tab === "interdisciplinario" && (
        <InterdisciplinaryTab child={child} meetings={meetings} users={users} onAddMeeting={onAddMeeting} currentUser={currentUser} documents={documents} onAddDocument={onAddDocument} />
      )}
    </div>
  );
}

export default ChildProfile;
export { CHILD_TABS, DEFAULT_CHILD_TAB };
