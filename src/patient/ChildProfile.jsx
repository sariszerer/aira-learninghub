import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { T, SPECIALIST_COLORS, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { can } from "../permissions.js";
import { Avatar, Btn, Card } from "../ui/index.js";
import ResumenTab from "./tabs/ResumenTab.jsx";
import SesionesTab from "./tabs/SesionesTab.jsx";
import ObjectivesList from "./tabs/ObjetivosTab.jsx";
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
  const [editForm, setEditForm] = useState({
    name: child.name, lastName: child.lastName,
    birthDate: child.birthDate || "", admissionDate: child.admissionDate || "",
    parentName: child.parentContact?.name || "",
    parentPhone: child.parentContact?.phone || "",
    parentEmail: child.parentContact?.email || "",
  });

  const handleSaveProfile = () => {
    onUpdateChild(child.id, {
      name: editForm.name.trim(),
      lastName: editForm.lastName.trim(),
      birthDate: editForm.birthDate || null,
      admissionDate: editForm.admissionDate || null,
      parentContact: { name: editForm.parentName, phone: editForm.parentPhone, email: editForm.parentEmail },
    });
    setEditingProfile(false);
  };

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
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 31, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em" }}>
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
            <button onClick={() => setEditingProfile(true)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: `1px solid ${T.border}`, borderRadius: 10, padding: "7px 14px",
              fontSize: 13, color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              ✎ Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* Edit profile modal */}
      {editingProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 24 }}>
              Editar perfil
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Nombre", key: "name" },
                { label: "Apellido", key: "lastName" },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Fecha de nacimiento", key: "birthDate", type: "date" },
                { label: "Fecha de ingreso", key: "admissionDate", type: "date" },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input type={type} value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del padre/madre</div>
              <input value={editForm.parentName} onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.brand}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 24 }}>
              {[
                { label: "Teléfono", key: "parentPhone" },
                { label: "Email", key: "parentEmail" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingProfile(false)} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 14, fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSaveProfile} disabled={!editForm.name.trim() || !editForm.lastName.trim()} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: T.brand, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", opacity: (!editForm.name.trim() || !editForm.lastName.trim()) ? 0.5 : 1 }}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 26 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "8px 2px",
            marginRight: 26, fontSize: 15.5, fontFamily: "Fraunces, serif",
            fontWeight: tab === t.id ? 600 : 500,
            fontStyle: tab === t.id ? "normal" : "italic",
            color: tab === t.id ? T.ink : T.inkFaint,
            borderBottom: tab === t.id ? `2px solid ${T.amber}` : "2px solid transparent",
            transition: "color .15s ease",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab child={child} objectives={objectives} sessions={sessions} users={users} onRenewPackage={onRenewPackage} onCloseProcess={onCloseProcess} currentUser={currentUser} />}
      {tab === "sesiones" && <SesionesTab child={child} sessions={sessions} objectives={objectives} users={users} currentUser={currentUser} onUpdateSession={onUpdateSession} />}
      {tab === "objetivos" && (() => {
        const childObjs = objectives.filter((o) => o.childId === child.id);
        const groups = {};
        childObjs.forEach((o) => {
          const specId = o.specialistId || "sin-especialista";
          const area = o.area || "General";
          const key = `${specId}__${area}`;
          if (!groups[key]) groups[key] = { specId, area, objs: [] };
          groups[key].objs.push(o);
        });
        const groupList = Object.values(groups).sort((a, b) => a.area.localeCompare(b.area));
        const canEdit = (specId) => can(currentUser, "objective:edit", { specialistId: specId });
        const AREA_COLORS = {
          "Terapia Ocupacional": "#175FAF",
          "Fonoaudiologia": "#7A9E7E",
          "Fonoaudiología": "#7A9E7E",
          "Funciones Ejecutivas": "#C79A6B",
          "Psicologia": "#A6779A",
          "Psicología": "#A6779A",
          "Psicologia Clinica": "#A6779A",
          "Psicología Clínica": "#A6779A",
          "Desarrollo (DVLP)": "#B8860B",
          "Kids Club": "#82A166",
          "General": T.inkSoft,
        };
        const AREA_BG = {
          "Terapia Ocupacional": "#E6F1FB",
          "Fonoaudiologia": "#F0F5F0",
          "Funciones Ejecutivas": "#FAF0E6",
          "Psicologia": "#F5EEF8",
          "Psicologia Clinica": "#F5EEF8",
          "Desarrollo (DVLP)": "#FEFDE7",
          "Kids Club": "#EEF5EE",
          "General": T.surfaceSunk,
        };

        // Show specialists who have sessions with this child but no objectives
        const specsFromSessions = [...new Set(
          sessions.filter(s => s.childId === child.id).map(s => s.specialistId).filter(Boolean)
        )];
        const specsWithNoObjs = specsFromSessions.filter(sid => !Object.keys(groups).some(k => k.startsWith(sid)));

        return (
          <div>
            {/* Column grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(groupList.length + specsWithNoObjs.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
              {groupList.map(({ specId, area, objs }) => {
                const spec = users.find(u => u.id === specId);
                const canEditThis = canEdit(specId);
                const logrados = objs.filter(o => o.status === "logrado").length;
                const color = AREA_COLORS[area] || T.inkSoft;
                const bg = AREA_BG[area] || T.surfaceSunk;
                const pct = objs.length > 0 ? (logrados / objs.length) * 100 : 0;
                return (
                  <div key={`${specId}__${area}`} style={{ background: "#fff", border: `0.5px solid ${T.border}`, borderTop: `3px solid ${color}`, borderRadius: "0 0 12px 12px" }}>
                    {/* Column header */}
                    <div style={{ padding: "12px 14px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{area}</div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec ? spec.name : "—"}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                        <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color }}>{logrados}</span>
                        <span style={{ fontSize: 13, color: T.inkSoft }}>/ {objs.length} logrados</span>
                      </div>
                      <div style={{ height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                    </div>
                    {/* Objectives */}
                    <div style={{ borderTop: `0.5px solid ${T.border}`, padding: "6px 14px 10px" }}>
                      {objs.map((o) => (
                        <div key={o.id} style={{ padding: "7px 0", borderBottom: `0.5px solid ${T.borderSoft}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{o.status === "logrado" ? "✅" : o.status === "apoyo" ? "🔴" : "🟡"}</span>
                            <span style={{ fontSize: 12.5, color: o.status === "logrado" ? "#2E7D32" : T.ink, lineHeight: 1.4, flex: 1 }}>{o.name}</span>
                          </div>
                          {canEditThis && (
                            <div style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 22 }}>
                              {["logrado","proceso","apoyo"].map(st => (
                                <button key={st} onClick={() => { if(onUpdateObjective) onUpdateObjective({...o, status: st}); }}
                                  style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "Inter, sans-serif",
                                    border: o.status === st ? "none" : `0.5px solid ${T.border}`,
                                    background: o.status === st ? (st === "logrado" ? "#E8F5E9" : st === "apoyo" ? "#FFEBEE" : "#FFF8E1") : "#fff",
                                    color: o.status === st ? (st === "logrado" ? "#2E7D32" : st === "apoyo" ? "#C62828" : "#F57F17") : T.inkSoft,
                                    fontWeight: o.status === st ? 600 : 400,
                                  }}>
                                  {st === "logrado" ? "✅ Logrado" : st === "proceso" ? "🟡 En proceso" : "🔴 Apoyo"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {canEditThis && (
                        <ObjectivesList
                          objectives={[]}
                          onUpdate={onUpdateObjective}
                          onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: specId, area, createdDate: TODAY, status: "proceso" })}
                          onDelete={onDeleteObjective}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Specialists with no objectives yet */}
              {specsWithNoObjs.map(sid => {
                const spec = users.find(u => u.id === sid);
                if (!spec) return null;
                const area = spec.specialty || "General";
                const color = AREA_COLORS[area] || T.inkSoft;
                const canEditThis = canEdit(sid);
                return (
                  <div key={`empty-${sid}`} style={{ background: "#fff", border: `0.5px solid ${T.border}`, borderTop: `3px solid ${color}40`, borderRadius: "0 0 12px 12px" }}>
                    <div style={{ padding: "12px 14px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: `${color}90`, marginBottom: 2 }}>{area}</div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec.name}</div>
                      <div style={{ fontSize: 12, color: T.inkFaint, fontStyle: "italic", padding: "8px 0" }}>Sin objetivos definidos.</div>
                    </div>
              {canEditThis && (
                      <div style={{ borderTop: `0.5px solid ${T.border}`, padding: "6px 14px 10px" }}>
                        <ObjectivesList
                          objectives={[]}
                          defaultArea={area}
                          onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: sid, area: data.area || area, createdDate: TODAY, status: "proceso" })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Full edit view below columns — only for can-edit specialists */}
            {groupList.filter(({ specId }) => canEdit(specId)).map(({ specId, area, objs }) => {
              const color = AREA_COLORS[area] || T.inkSoft;
              const spec = users.find(u => u.id === specId);
              return (
                <details key={`edit-${specId}__${area}`} style={{ marginBottom: 10 }}>
                  <summary style={{ fontSize: 12.5, color, cursor: "pointer", padding: "6px 0", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ti ti-edit" style={{ fontSize: 14 }} />
                    Editar objetivos de {area} ({spec?.name})
                  </summary>
                  <Card style={{ padding: "6px 18px 14px", marginTop: 6 }}>
                    <ObjectivesList
                      objectives={objs}
                      onUpdate={onUpdateObjective}
                      onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: specId, area, createdDate: TODAY, status: "proceso" })}
                      onDelete={onDeleteObjective}
                    />
                  </Card>
                </details>
              );
            })}
          </div>
        );
      })()}
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
