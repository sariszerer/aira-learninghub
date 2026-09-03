import React from "react";
import { T } from "../theme.js";
import { Btn, Card } from "./index.js";

function ReportCard({ icon: Icon, tone, title, description, action, actionLabel, badge }) {
  const tones = {
    brand: { bg: T.brandTint, fg: T.brand },
    amber: { bg: T.amberTint, fg: T.amberDeep },
  }[tone];
  return (
    <Card style={{ padding: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: tones.bg, color: tones.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.ink }}>{title}</div>
            {badge}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3, maxWidth: 380 }}>{description}</div>
        </div>
      </div>
      <Btn variant={tone === "amber" ? "amber" : "primary"} onClick={action}>{actionLabel}</Btn>
    </Card>
  );
}

export default ReportCard;
