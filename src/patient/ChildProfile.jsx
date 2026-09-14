import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { T, SPECIALIST_COLORS, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { can } from "../permissions.js";
import { Avatar, Btn, Card, Tabs } from "../ui/index.js";
import ResumenTab from "./tabs/ResumenTab.jsx";
import SesionesTab from "./tabs/SesionesTab.jsx";
import ObjetivosTab, { ObjectivesList } from "./tabs/ObjetivosTab.jsx";
import EditProfileModal from "./EditProfileModal.jsx";
import BorrarPacienteModal from "./BorrarPacienteModal.jsx";
import PlanTrabajoTab from "./tabs/PlanTrabajoTab.jsx";
import AnamnesisTab from "./tabs/AnamnesisTab.jsx";
import ReportesTab from "./tabs/ReportesTab.jsx";
import InterdisciplinaryTab from "./tabs/InterdisciplinaryTab.jsx";
import { useDataStore } from "../store/dataStore.js";
import { useEsMovil } from "../lib/pantalla.js";
import { esAcudiente, pestanasDe, textoDeVinculo } from "../lib/expediente.js";
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
  const children = useDataStore((s) => s.children);
  const onUpdateChild = useDataStore((s) => s.updateChild);
  const onCloseProcess = useDataStore((s) => s.closeProcess);
  const onUpdateSession = useDataStore((s) => s.updateSession);
  const onUpdateDocument = useDataStore((s) => s.updateDocument);
  // Active tab lives in the URL (?tab=sesiones) so profile views are shareable.
  // An unknown or missing slug falls back to Resumen instead of rendering nothing.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  // La pestaña pedida tiene que existir PARA ESTE expediente: un enlace a
  // ?tab=anamnesis en la ficha de una madre dejaría la pantalla en blanco.
  const permitidas = pestanasDe(child);
  const tab = permitidas.includes(tabParam) ? tabParam : DEFAULT_CHILD_TAB;
  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    // Resumen is the default view, so it stays out of the URL.
    if (id === DEFAULT_CHILD_TAB) next.delete("tab");
    else next.set("tab", id);
    // replace: Back returns to the patient list rather than walking back through tabs.
    setSearchParams(next, { replace: true });
  };
  const esMovil = useEsMovil();
  const [editingProfile, setEditingProfile] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const navegar = useNavigate();

  const specialistIdsFromSessions = [...new Set(
    sessions.filter(s => s.childId === child.id).map(s => s.specialistId).filter(Boolean)
  )];
  const specialists = specialistIdsFromSessions.length > 0
    ? specialistIdsFromSessions.map(id => users.find(u => u.id === id)).filter(Boolean)
    : child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  // Un acudiente no tiene reporte para la familia — la familia es él — ni
  // reunión interdisciplinaria sobre su caso. Su anamnesis sí existe, con los
  // campos de ANAMNESIS_ACUDIENTE en vez de los del desarrollo.
  const tabs = CHILD_TABS.filter((t) => permitidas.includes(t.id));

  return (
    <div>
      {/* Cabecera fija: identidad del paciente y pestañas. Se queda arriba al
          hacer scroll porque en una ficha con siete pestañas y listas largas,
          perder de vista de quien es el expediente es el peor sitio donde
          perderlo. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: T.bg, padding: esMovil ? "12px 12px 10px" : "20px 28px 14px",
      }}>
      <Card style={{ padding: "18px 20px 0" }}>
      {/* En movil apila: los botones al lado dejaban el nombre en dos lineas y
          ellos mismos se salian por la derecha. */}
      <div style={{
        display: "flex", gap: esMovil ? 12 : 18, marginBottom: 16,
        alignItems: "flex-start", flexDirection: esMovil ? "column" : "row",
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%", minWidth: 0 }}>
        <Avatar name={child.name + " " + child.lastName} bg={child.avatarBg} size={esMovil ? 44 : 56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 21, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
            {child.name} {child.lastName}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 7, fontSize: 13.5, color: T.inkSoft }}>
            {/* A una madre no se le pide fecha de nacimiento, así que tampoco
                se le reclama: "Fecha nacimiento pendiente" en su ficha sería
                una tarea que nadie va a hacer nunca. */}
            {esAcudiente(child) ? (
              <span>{textoDeVinculo(child, children)}</span>
            ) : (
              <>
                {child.age != null && <span>{child.age} años</span>}
                {child.birthDate ? <span>Nació el {fmtDate(child.birthDate)}</span> : <span style={{color:T.muted}}>Fecha nacimiento pendiente</span>}
              </>
            )}
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
        </div>
        {/* Los tres en fila, y los tres del mismo tamano. Apilados, un lg
            encima de dos sm se leia como un boton con dos notas al pie; en
            fila esa diferencia de altura queda desparejo. La jerarquia la
            llevan los colores — primario, secundario, ghost — que es donde se
            nota sin descolocar la linea. */}
        <div style={{
          display: "flex", gap: 8, flexShrink: 0,
          alignItems: "center", flexWrap: "wrap",
          width: esMovil ? "100%" : undefined,
        }}>
          {/* Antes exigia ademas figurar en assignedSpecialists. Eso bloqueaba
              trabajo real: 44 de las 438 sesiones de la clinica, en 9 pacientes,
              las dio alguien que no estaba en esa lista. Y era redundante para
              quien si deberia estar limitado — un rol con alcance "asignados" no
              llega siquiera a ver la ficha, porque RLS se lo impide en la base.
              El permiso mas el alcance ya son la puerta correcta. */}
          {can(currentUser, "session:create") && (
            <Btn icon={Plus} onClick={onOpenSessionForm}>Registrar sesión</Btn>
          )}
          {can(currentUser, "patient:edit") && (
            <Btn variant="secondary" icon={Pencil} onClick={() => setEditingProfile(true)}>Editar perfil</Btn>
          )}
          {/* Discreto a proposito: borra el expediente entero en cascada y no
              es la accion que nadie viene a hacer a esta pantalla. La ficha que
              se cierra al terminar el tratamiento se cierra desde Resumen. */}
          {can(currentUser, "patient:delete") && (
            <Btn variant="ghost" icon={Trash2} onClick={() => setBorrando(true)}>Borrar paciente</Btn>
          )}
        </div>
      </div>

      {editingProfile && <EditProfileModal child={child} onClose={() => setEditingProfile(false)} />}
      {borrando && (
        <BorrarPacienteModal
          child={child}
          onClose={() => setBorrando(false)}
          onBorrado={() => navegar("/pacientes")}
        />
      )}

        <div style={{ marginLeft: -3, marginRight: -3 }}>
          <Tabs tabs={tabs} activo={tab} onCambiar={setTab} />
        </div>
      </Card>
      </div>

      <div style={{ padding: "0 28px 48px" }}>

      {tab === "resumen" && <ResumenTab child={child} objectives={objectives} sessions={sessions} users={users} onRenewPackage={onRenewPackage} onCloseProcess={onCloseProcess} currentUser={currentUser} />}
      {tab === "sesiones" && <SesionesTab child={child} sessions={sessions} objectives={objectives} users={users} currentUser={currentUser} onUpdateSession={onUpdateSession} />}
      {tab === "objetivos" && <ObjetivosTab child={child} />}
      {tab === "plan" && <PlanTrabajoTab child={child} documents={documents} users={users} currentUser={currentUser} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} />}

      {tab === "anamnesis" && (
        <AnamnesisTab
          child={child} documents={documents} users={users} currentUser={currentUser}
          onAddDocument={onAddDocument}
          onUpdateDocument={onUpdateDocument}
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
    </div>
  );
}

export default ChildProfile;
export { CHILD_TABS, DEFAULT_CHILD_TAB };
