import React from "react";
import { T } from "../theme.js";

function Field({ label, value }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ fontSize: 11.5, color: T.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 14.5, color: T.ink, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default Field;
