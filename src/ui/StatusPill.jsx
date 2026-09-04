import React from "react";
import { STATUS } from "../theme.js";
import { T } from "../theme.js";

function StatusPill({ status, size = "sm" }) {
  const s = STATUS[status];
  if (!s) return null;
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const font = size === "sm" ? 12 : 13;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.tint, color: s.color, borderRadius: 999,
      padding: pad, fontSize: font, fontWeight: 600, fontFamily: T.font,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

export default StatusPill;
