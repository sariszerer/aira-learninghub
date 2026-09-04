import React from "react";
import { T } from "../theme.js";

// Boton canonico. Todo control de accion de la aplicacion sale de aqui: cuando
// cada pantalla escribia el suyo a mano acababa habiendo cinco radios, cuatro
// alturas y dos azules distintos para la misma cosa.
//
// `amber` sobrevive como alias de `primary`. Nombraba el color de energia del
// tema anterior; al cambiar la paleta paso a cian y dejo botones de accion
// principal en un color que ya no significaba nada. Se conserva el nombre para
// no romper las llamadas existentes, pero apunta al mismo sitio que primary.
const VARIANTES = {
  // accion principal de la pantalla — una sola por vista
  primary: { background: T.brand, color: "#fff", border: "1px solid transparent" },
  amber: { background: T.brand, color: "#fff", border: "1px solid transparent" },

  // accion secundaria — conviven varias sin competir
  secondary: { background: T.surface, color: T.inkSoft, border: `1px solid ${T.border}` },
  ghost: { background: T.surface, color: T.brand, border: `1px solid ${T.border}` },

  // terciaria, dentro de una tarjeta que ya tiene fondo blanco
  subtle: { background: T.brandTint, color: T.brand, border: "1px solid transparent" },

  // destructiva
  danger: { background: T.apoyoTint, color: T.apoyo, border: `1px solid ${T.apoyo}22` },

  // solo texto, sin caja
  link: { background: "transparent", color: T.brand, border: "1px solid transparent" },
};

const TAMANOS = {
  sm: { padding: "6px 12px", fontSize: 12.5, radius: T.radiusSm, icono: 14 },
  md: { padding: "8px 14px", fontSize: 13.5, radius: T.radiusSm, icono: 15 },
  lg: { padding: "11px 20px", fontSize: 15, radius: T.radius, icono: 17 },
};

function Btn({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, full, title, type }) {
  const v = VARIANTES[variant] || VARIANTES.primary;
  const s = TAMANOS[size] || TAMANOS.md;

  return (
    <button
      type={type || "button"}
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        fontFamily: T.font, fontWeight: 600, whiteSpace: "nowrap",
        padding: s.padding, fontSize: s.fontSize, borderRadius: s.radius,
        ...v,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: full ? "100%" : "auto",
        transition: "filter .15s ease, background .15s ease",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.95)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {Icon && <Icon size={s.icono} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export default Btn;
