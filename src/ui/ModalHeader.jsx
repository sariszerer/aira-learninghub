import React from "react";
import { X } from "lucide-react";
import { T } from "../theme.js";

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "20px 24px", borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontFamily: T.font, fontSize: 19, fontWeight: 600, color: T.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        border: "none", background: T.surfaceSunk, borderRadius: 10, width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.inkSoft, flexShrink: 0,
      }}>
        <X size={16} />
      </button>
    </div>
  );
}

export default ModalHeader;
