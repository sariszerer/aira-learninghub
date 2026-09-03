import React from "react";
import { T } from "../theme.js";

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
        boxShadow: T.shadow, cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .18s ease, transform .18s ease",
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(32,48,46,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = "translateY(0)"; } : undefined}
    >
      {children}
    </div>
  );
}

export default Card;
