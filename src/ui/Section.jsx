import React from "react";
import { T } from "../theme.js";

function Section({ title, children, last }) {
  return (
    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 9 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default Section;
