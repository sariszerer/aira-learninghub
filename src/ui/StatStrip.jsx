import React from "react";
import { T } from "../theme.js";
import { Card } from "./index.js";

function StatStrip({ items }) {
  return (
    <Card style={{ padding: 0, marginBottom: 28, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it, i) => (
          <div key={it.label} style={{
            padding: "20px 22px", borderLeft: i > 0 ? `1px solid ${T.borderSoft}` : "none",
          }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, color: T.ink, lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 7 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default StatStrip;
