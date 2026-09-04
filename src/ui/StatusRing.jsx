import React from "react";
import { T, STATUS } from "../theme.js";

function StatusRing({ status, size = 34 }) {
  const s = STATUS[status] || STATUS.proceso;
  const frac = status === "logrado" ? 1 : status === "proceso" ? 0.6 : 0.28;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={T.border} strokeWidth="3.5" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth="3.5" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default StatusRing;
