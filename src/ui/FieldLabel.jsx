import React from "react";
import { T } from "../theme.js";

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{children}</div>;
}

export default FieldLabel;
