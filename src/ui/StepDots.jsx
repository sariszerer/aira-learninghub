import React from "react";
import { T } from "../theme.js";

function StepDots({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 7, height: 7, borderRadius: 999,
          background: i <= step ? T.amber : T.border, transition: "all .2s ease",
        }} />
      ))}
    </div>
  );
}

export default StepDots;
