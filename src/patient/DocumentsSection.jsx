import React, { useState } from "react";
import { Plus } from "lucide-react";
import { T } from "../theme.js";
import { DOC_TYPES } from "../constants.js";
import { fmtDateShort } from "../lib/format.js";
import { can } from "../permissions.js";
import { Btn, Card, EmptyNote, Eyebrow } from "../ui/index.js";

// `canAdd` llega desde quien la usa y no se decide aqui: cada tab tiene su
// propio permiso (workplan:create para el plan, document:create para reportes).
// Antes el boton se pintaba siempre, lo que duplicaba el del tab y ademas se
// saltaba su comprobacion.
function DocumentsSection({ type, documents, users, onAdd, onUpdateDocument, currentUser, canAdd = false }) {
  const meta = DOC_TYPES[type];
  const docs = documents.filter((d) => d.type === type).sort((a, b) => b.date.localeCompare(a.date));
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const startEdit = (d) => { setEditingId(d.id); setEditNotes(d.notes || ""); setExpandedId(d.id); };
  const saveEdit = (d) => { if (onUpdateDocument) onUpdateDocument({ ...d, notes: editNotes }); setEditingId(null); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Eyebrow style={{ marginBottom: 0 }}>{meta.plural}</Eyebrow>
        {canAdd && onAdd && <Btn variant="ghost" size="sm" icon={Plus} onClick={onAdd}>Agregar</Btn>}
      </div>
      {docs.length === 0 ? (
        <EmptyNote text={`Todavía no hay ${meta.plural.toLowerCase()} registradas.`} />
      ) : (
        <Card style={{ padding: 6 }}>
          {docs.map((d, i) => {
            const author = users.find((u) => u.id === d.authorId);
            const isEditing = editingId === d.id;
            const isExpanded = expandedId === d.id;
            const isPdf = d.fields?.pdfUrl || d.fields?.pdfData;
            const canEdit = can(currentUser, "document:edit", d);
            return (
              <div key={d.id} style={{ padding: "13px 14px", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isPdf && <span style={{ fontSize: 11, background: "#FFEBEE", color: "#C62828", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>PDF</span>}
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{d.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{author?.name || "—"} · {fmtDateShort(d.date)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isPdf && (
                      <a href={d.fields.pdfUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: T.brand, textDecoration: "none", padding: "4px 8px", border: `1px solid ${T.border}`, borderRadius: 6 }}>
                        Ver PDF
                      </a>
                    )}
                    {canEdit && !isEditing && (
                      <Btn variant="secondary" size="sm" onClick={() => startEdit(d)}>Editar</Btn>
                    )}
                    {d.notes && !isEditing && (
                      <button onClick={() => setExpandedId(isExpanded ? null : d.id)} style={{ fontSize: 12, color: T.brand, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                        {isExpanded ? "▲ Cerrar" : "▼ Ver"}
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div style={{ marginTop: 10 }}>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={8}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.brand}`, fontSize: 13.5, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6, whiteSpace: "pre-wrap" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEdit(d)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Guardar</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13, fontFamily: T.font, cursor: "pointer" }}>Cancelar</button>
                    </div>
                  </div>
                ) : isExpanded && d.notes ? (
                  <div style={{ fontSize: 13.5, color: T.ink, marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "10px 12px", background: T.surfaceSunk, borderRadius: 8 }}>{d.notes}</div>
                ) : null}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

export default DocumentsSection;
