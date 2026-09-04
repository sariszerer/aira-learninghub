import React from "react";
import { T } from "../theme.js";

// Boton de solo icono. Existe aparte de Btn porque un control cuadrado con un
// icono dentro y uno con etiqueta tienen reglas distintas de tamano y de
// accesibilidad: aqui `title` no es opcional, es lo unico que dice que hace.
const TONOS = {
  neutro: { color: T.inkFaint, background: T.surface, border: `1px solid ${T.border}` },
  marca: { color: T.brand, background: T.brandTint, border: "1px solid transparent" },
  peligro: { color: T.apoyo, background: T.apoyoTint, border: "1px solid transparent" },
  plano: { color: T.inkFaint, background: "transparent", border: "1px solid transparent" },
};

const TAMANOS = { sm: { caja: 26, icono: 13 }, md: { caja: 32, icono: 15 } };

function IconBtn({ icon: Icon, title, onClick, tone = "neutro", size = "md", disabled }) {
  const t = TONOS[tone] || TONOS.neutro;
  const s = TAMANOS[size] || TAMANOS.md;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: s.caja, height: s.caja, borderRadius: T.radiusSm,
        display: "grid", placeItems: "center", flexShrink: 0,
        ...t,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "filter .15s ease",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.95)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      <Icon size={s.icono} strokeWidth={2.2} />
    </button>
  );
}

export default IconBtn;
