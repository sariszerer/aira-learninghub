import React, { useState } from "react";
import { T } from "../../theme.js";
import { StatusPill, StatusRing } from "../../ui/index.js";

function ObjectivesList({ objectives, compact, onUpdate, onAdd, onDelete, defaultArea }) {
  const [editing, setEditing] = useState(null); // obj id being edited
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState(defaultArea || "");

  const STATUS_OPTS = [
    { val: "logrado", label: "✅ Logrado" },
    { val: "proceso", label: "🟡 En proceso" },
    { val: "apoyo", label: "🔴 Necesita apoyo" },
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
                  style={{ width: "100%", padding: "4px 8px", borderRadius: 7, border: `1.5px solid ${T.brand}`, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
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
                      background: o.status === s.val ? (s.val === "logrado" ? "#81C784" : s.val === "proceso" ? T.amber : "#E57373") : T.bg,
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      outline: o.status === s.val ? `2px solid ${s.val === "logrado" ? "#43A047" : s.val === "proceso" ? T.amberDeep : "#C62828"}` : "none",
                    }}>
                    {s.val === "logrado" ? "✅" : s.val === "proceso" ? "🟡" : "🔴"}
                  </button>
                ))}
              </div>
            )}

            {!compact && onUpdate && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {editing === o.id ? (
                  <>
                    <button onClick={() => saveEdit(o)} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✓</button>
                    <button onClick={() => setEditing(null)} style={{ background: T.bg, color: T.inkSoft, border: `1px solid ${T.border}`, borderRadius: 7, padding: "3px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(o)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Editar nombre">✎</button>
                    {onDelete && <button onClick={() => onDelete(o.id)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Eliminar">🗑</button>}
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
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${T.brand}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 3 }}>Área</div>
                <input value={newArea} onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Ej: Psicología"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAdd} disabled={!newName.trim()} style={{ background: T.brand, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: !newName.trim() ? 0.5 : 1 }}>Agregar</button>
                <button onClick={() => { setAdding(false); setNewName(""); setNewArea(""); }} style={{ background: T.bg, color: T.inkSoft, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ background: "none", border: `1.5px dashed ${T.border}`, borderRadius: 10, padding: "8px 16px", fontSize: 13, color: T.inkSoft, cursor: "pointer", fontFamily: "Inter, sans-serif", width: "100%", textAlign: "center" }}>
              + Agregar objetivo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ObjectivesList;
