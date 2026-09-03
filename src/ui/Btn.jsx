import React from "react";
import { T } from "../theme.js";

function Btn({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, full }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: T.font, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    border: "none", borderRadius: 12, transition: "all .15s ease",
    opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
  };
  const sizes = {
    md: { padding: "11px 18px", fontSize: 14 },
    lg: { padding: "15px 24px", fontSize: 15.5 },
    sm: { padding: "7px 13px", fontSize: 13 },
  };
  const variants = {
    primary: { background: T.brand, color: "#fff" },
    amber: { background: T.amber, color: T.brandDeep },
    ghost: { background: "transparent", color: T.brand, border: `1.5px solid ${T.border}` },
    subtle: { background: T.brandTint, color: T.brand },
    danger: { background: T.apoyoTint, color: T.apoyo },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.94)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {Icon && <Icon size={size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}

export default Btn;
