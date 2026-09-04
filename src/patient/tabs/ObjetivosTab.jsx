import React, { useState } from "react";
import { T, TODAY } from "../../theme.js";
import { Card, StatusIcon, StatusPill, StatusRing } from "../../ui/index.js";
import { useDataStore } from "../../store/dataStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { can } from "../../permissions.js";
import { Btn } from "../../ui/index.js";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

function ObjectivesList({ objectives, compact, onUpdate, onAdd, onDelete, defaultArea }) {
  const [editing, setEditing] = useState(null); // obj id being edited
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState(defaultArea || "");

  const STATUS_OPTS = [
    { val: "logrado", label: "Logrado" },
    { val: "proceso", label: "En proceso" },
    { val: "apoyo", label: "Necesita apoyo" },
  ];

  const startEdit = (o) => { setEditing(o.id); setEditName(o.name); };
  const saveEdit = (o) => { if (onUpdate && editName.trim()) onUpdate({ ...o, name: editName.trim() }); setEditing(null); };

  const handleAdd = () => {
    if (onAdd && newName.trim()) {
      onAdd({ name: newName.trim(), area: newArea.trim() || "General" });
      setNewName(""); setNewArea(""); setAdding(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 0 }}>
        {objectives.map((o, i) => (
          <div key={o.id} style={{
            display: "flex", alignItems: "center", gap: 13, padding: compact ? "6px 0" : "13px 0",
            borderTop: !compact && i > 0 ? `1px solid ${T.border}` : "none",
          }}>
            <StatusRing status={o.status} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing === o.id ? (
                <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(o); if (e.key === "Escape") setEditing(null); }}
                  style={{ width: "100%", padding: "4px 8px", borderRadius: 7, border: `1.5px solid ${T.brand}`, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                />
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: T.ink }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>{o.area}</div>
                </>
              )}
            </div>

            {/* Status selector */}
            {onUpdate && !compact && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {STATUS_OPTS.map((s) => (
                  <button key={s.val} onClick={() => onUpdate({ ...o, status: s.val })}
                    title={s.label}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: "none", cursor: "pointer",
                      background: o.status === s.val ? (s.val === "logrado" ? T.logrado : s.val === "proceso" ? T.amber : T.apoyo) : T.bg,
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      outline: o.status === s.val ? `2px solid ${s.val === "logrado" ? "#43A047" : s.val === "proceso" ? T.amberDeep : "#C62828"}` : "none",
                    }}>
                    <StatusIcon status={s.val} size={13} />
                  </button>
                ))}
              </div>
            )}

            {!compact && onUpdate && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {editing === o.id ? (
                  <>
                    <button onClick={() => saveEdit(o)} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: T.font }}><Check size={13} /></button>
                    <button onClick={() => setEditing(null)} style={{ background: T.bg, color: T.inkSoft, border: `1px solid ${T.border}`, borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: T.font }}><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(o)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Editar nombre"><Pencil size={13} /></button>
                    {onDelete && <button onClick={() => onDelete(o.id)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Eliminar"><Trash2 size={13} /></button>}
                  </>
                )}
              </div>
            )}

            {compact && <StatusPill status={o.status} />}
          </div>
        ))}
      </div>

      {/* Add objective */}
      {onAdd && !compact && (
        <div style={{ marginTop: 14 }}>
          {adding ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 3 }}>Nombre del objetivo</div>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Regulación emocional"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${T.brand}`, fontSize: 13.5, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 3 }}>Área</div>
                <input value={newArea} onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Ej: Psicología"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" onClick={handleAdd} disabled={!newName.trim()}>Agregar</Btn>
                <Btn size="sm" variant="secondary" onClick={() => { setAdding(false); setNewName(""); setNewArea(""); }}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <Btn variant="subtle" size="sm" icon={Plus} onClick={() => setAdding(true)}>Agregar objetivo</Btn>
          )}
        </div>
      )}
    </div>
  );
}

// Vista de objetivos agrupados por especialista y area. Estaba en linea dentro
// de ChildProfile como una IIFE de 155 lineas; aqui es un componente con nombre.
function ObjetivosTab({ child }) {
  const objectives = useDataStore((s) => s.objectives);
  const sessions = useDataStore((s) => s.sessions);
  const users = useDataStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.currentUser);
  const onUpdateObjective = useDataStore((s) => s.updateObjective);
  const onAddObjective = useDataStore((s) => s.addObjective);
  const onDeleteObjective = useDataStore((s) => s.deleteObjective);
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
                <div key={`${specId}__${area}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 0 12px 12px" }}>
                  {/* Column header */}
                  <div style={{ padding: "12px 14px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.brand, marginBottom: 2 }}>{area}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec ? spec.name : "—"}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                      <span style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color }}>{logrados}</span>
                      <span style={{ fontSize: 13, color: T.inkSoft }}>/ {objs.length} logrados</span>
                    </div>
                    <div style={{ height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  {/* Objectives */}
                  <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "6px 14px 10px" }}>
                    {objs.map((o) => (
                      <div key={o.id} style={{ padding: "7px 0", borderTop: `1px solid ${T.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ display: "flex", flexShrink: 0, marginTop: 2 }}><StatusIcon status={o.status} size={14} /></span>
                          <span style={{ fontSize: 12.5, color: o.status === "logrado" ? T.logrado : T.ink, lineHeight: 1.4, flex: 1 }}>{o.name}</span>
                        </div>
                        {canEditThis && (
                          <div style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 22 }}>
                            {["logrado","proceso","apoyo"].map(st => (
                              <button key={st} onClick={() => { if(onUpdateObjective) onUpdateObjective({...o, status: st}); }}
                                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontFamily: T.font,
                                  border: o.status === st ? "none" : `0.5px solid ${T.border}`,
                                  background: o.status === st ? (st === "logrado" ? "#E8F5E9" : st === "apoyo" ? "#FFEBEE" : "#FFF8E1") : "#fff",
                                  color: o.status === st ? (st === "logrado" ? T.logrado : st === "apoyo" ? "#C62828" : "#F57F17") : T.inkSoft,
                                  fontWeight: o.status === st ? 600 : 400,
                                }}>
                                {st === "logrado" ? "Logrado" : st === "proceso" ? "En proceso" : "Apoyo"}
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
                <div key={`empty-${sid}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 0 12px 12px" }}>
                  <div style={{ padding: "12px 14px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.brand, marginBottom: 2 }}>{area}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec.name}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint, padding: "8px 0" }}>Sin objetivos definidos.</div>
                  </div>
            {canEditThis && (
                    <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "6px 14px 10px" }}>
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
}

export default ObjetivosTab;
export { ObjectivesList };
