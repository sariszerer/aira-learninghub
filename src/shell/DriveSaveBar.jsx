import React from "react";
import { T } from "../theme.js";

function DriveSaveBar({ status, onSave }) {
  if (status === "idle") return null;
  const conf = {
    saving: { bg: "#FFF8E1", color: T.amberDeep, text: "Guardando en Drive..." },
    saved:  { bg: "#E8F5E9", color: "#2E7D32", text: "✓ Guardado en Google Drive" },
    error:  { bg: "#FFEBEE", color: "#C62828", text: "⚠ Error al guardar — reintenta" },
  }[status] || {};
  return (
    <div style={{ background: conf.bg, color: conf.color, fontSize: 12.5, fontWeight: 600, textAlign: "center", padding: "6px 20px", borderBottom: `1px solid ${conf.color}22`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {conf.text}
      {status === "error" && <button onClick={onSave} style={{ background: conf.color, color: "#fff", border: "none", borderRadius: 6, padding: "2px 10px", fontSize: 12, cursor: "pointer", fontFamily: T.font }}>Reintentar</button>}
    </div>
  );
}

export default DriveSaveBar;
