import React from "react";
import { Check } from "lucide-react";
import { T } from "../theme.js";

function SavedToast() {
  return (
    <div style={{
      position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      background: T.brandDeep, color: "#fff", padding: "13px 22px", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600,
      boxShadow: "0 10px 30px rgba(21,47,54,0.35)", fontFamily: T.font,
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: T.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={13} strokeWidth={3} />
      </span>
      Sesión guardada · reporte diario generado automáticamente
    </div>
  );
}

export default SavedToast;
