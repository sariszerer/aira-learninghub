import React from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { T } from "../theme.js";
import { Logo, Avatar } from "../ui/index.js";

function TopBar({ user, onBack, backLabel, onLogout, onHome, showGabinete, onGabinete, gabineteActive, onSave }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30, background: "rgba(248,246,240,0.92)",
      backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        maxWidth: 1060, margin: "0 auto", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={onHome} style={{ cursor: "pointer" }}><Logo size={24} /></div>
          {onBack && (
            <button onClick={onBack} style={{
              display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
              color: T.inkSoft, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "Fraunces, serif", fontStyle: "italic",
            }}>
              <ChevronLeft size={15} /> {backLabel || "Volver"}
            </button>
          )}
          {showGabinete && !onBack && (
            <button onClick={onGabinete} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${gabineteActive ? T.brand : T.border}`,
              background: gabineteActive ? T.brand : "transparent",
              color: gabineteActive ? "#fff" : T.inkSoft,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              🏫 Gabinete externo
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{user.name}</div>
            <div style={{ fontSize: 11.5, color: T.inkFaint }}>{user.home === "admin" || user.home === "clinico" ? user.title || user.specialty : user.home === "tutor" ? `Tutor AIRA · ${user.school}` : user.specialty}</div>
          </div>
          <Avatar name={user.name} bg={user.avatarBg} size={36} />
          {onSave && (
            <button onClick={onSave} title="Guardar en Drive" style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              💾 Guardar
            </button>
          )}
          <button onClick={onLogout} title="Cerrar sesión" style={{
            width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.inkFaint,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.inkSoft)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
