import React from "react";
import { Calendar, Clock } from "lucide-react";
import { T } from "../theme.js";
import { contar } from "../lib/format.js";
import { Eyebrow, Avatar, Card } from "../ui/index.js";

function TodaySchedule({ childrenToday, onOpenChild }) {
  if (childrenToday.length === 0) {
    return (
      <Card style={{ padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceSunk, color: T.inkFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Calendar size={16} />
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft }}>No tienes sesiones programadas para hoy.</div>
      </Card>
    );
  }
  return (
    <Card style={{ padding: "8px 6px", marginBottom: 28 }}>
      <div style={{ padding: "12px 14px 6px" }}>
        <Eyebrow style={{ marginBottom: 0 }}>
          Hoy — {contar(childrenToday.length, "sesión", "sesiones")}
        </Eyebrow>
      </div>
      {childrenToday.map((c, i) => (
        <button key={c.id} onClick={() => onOpenChild(c.id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "11px 14px",
          border: "none", borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none",
          background: "transparent", cursor: "pointer", textAlign: "left",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceSunk)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Avatar name={c.name + " " + c.lastName} bg={c.avatarBg} size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: T.ink }}>{c.name} {c.lastName}</div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: T.brand }}>
            <Clock size={12} /> {c.nextSessionTime || "Sin horario"}
          </span>
        </button>
      ))}
    </Card>
  );
}

export default TodaySchedule;
