import React from "react";
import { T, inputStyle, TODAY } from "../theme.js";
import { FieldLabel } from "./index.js";

function DateRangeBar({ fromDate, setFromDate, minDate, presets }) {
  return (
    <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FieldLabel style={{ margin: 0 }}>Desde</FieldLabel>
        <input
          type="date" value={fromDate} min={minDate} max={TODAY}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ ...inputStyle, padding: "7px 10px", fontSize: 13 }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button key={p.label} onClick={() => setFromDate(p.value)} style={{
            fontSize: 12.5, fontWeight: 600, color: T.brand, background: T.brandTint,
            border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer",
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

export default DateRangeBar;
