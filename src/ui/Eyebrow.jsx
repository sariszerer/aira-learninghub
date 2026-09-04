import React from "react";
import { T } from "../theme.js";

// Titulo de seccion. Antes era serif en italica; ahora es sans en semibold,
// que es lo que separa secciones en un panel de gestion sin competir con las
// cifras. Se conserva la firma para no tocar los 10 archivos que lo usan.
function Eyebrow({ children, tone = "amber", style }) {
  const color = tone === "faint" ? T.inkFaint : T.ink;
  return (
    <div style={{
      fontFamily: T.font, fontWeight: 600, fontSize: 14.5, color,
      letterSpacing: "-0.01em", marginBottom: 12, ...style,
    }}>
      {children}
    </div>
  );
}

export default Eyebrow;
