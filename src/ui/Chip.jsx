import React from "react";
import { Check } from "lucide-react";
import { T } from "../theme.js";

function Chip({ label, selected, onClick, tone = "brand" }) {
  const activeColors = tone === "brand"
    ? { bg: T.brand, fg: "#fff", border: T.brand }
    : { bg: T.amberTint, fg: T.amberDeep, border: T.amber };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 15px", borderRadius: 11, fontSize: 14, fontWeight: 600,
        fontFamily: "Inter, sans-serif", cursor: "pointer",
        border: `1.5px solid ${selected ? activeColors.border : T.border}`,
        background: selected ? activeColors.bg : "#fff",
        color: selected ? activeColors.fg : T.inkSoft,
        transition: "all .12s ease",
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${selected ? activeColors.fg : T.border}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: selected ? "rgba(255,255,255,0.15)" : "transparent",
      }}>
        {selected && <Check size={11} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

export default Chip;
