import React from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { Avatar, Card } from "../ui/index.js";

function ChildCard({ child, users, sessions, onOpen }) {
  const specialists = child.assignedSpecialists.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  return (
    <Card onClick={onOpen} style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        height: 58, background: `linear-gradient(135deg, ${child.avatarBg}26, ${child.avatarBg}08)`,
        position: "relative",
      }} />
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "inline-block", borderRadius: "50%", boxShadow: "0 0 0 4px #fff" }}>
          <Avatar name={child.name + " " + child.lastName} bg={child.avatarBg} size={58} />
        </div>
        <div style={{ marginTop: -34, paddingLeft: 68 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, color: T.ink, marginTop: 6 }}>
            {child.name} {child.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
            {child.status === "inactivo" && <span style={{color:"#B56060",fontWeight:600,marginRight:4}}>INACTIVO · </span>}{child.age != null ? `${child.age} años · ` : ""}{child.specialties.join(" · ")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkFaint, fontSize: 12.5 }}>
            <Calendar size={13} />
            {child.nextSession ? fmtDate(child.nextSession) : "Sin sesión programada"}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.brand, fontSize: 13, fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 500 }}>
            Ver perfil <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Card>
  );
}

export default ChildCard;
