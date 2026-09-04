import React from "react";
import { T } from "../theme.js";

// Contenedor base. Trae su propio padding: antes cada llamada lo ponia a mano y
// las que no lo hacian dejaban el contenido pegado al borde. Quien necesite
// otro valor lo pasa por `style`, que va despues y gana.
function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: 18,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .18s ease, transform .18s ease",
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.boxShadow = T.shadowLift;
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.boxShadow = T.shadow;
        e.currentTarget.style.transform = "none";
      } : undefined}
    >
      {children}
    </div>
  );
}

export default Card;
