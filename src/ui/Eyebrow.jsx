import React from "react";
import { T } from "../theme.js";

function Eyebrow({ children, tone = "amber", style }) {
  const color = tone === "amber" ? T.amberDeep : tone === "faint" ? T.inkFaint : T.brand;
  return (
    <div style={{
      fontFamily: "Fraunces, serif", fontStyle: "italic", fontWeight: 500,
      fontSize: 15, color, letterSpacing: "0.005em", marginBottom: 14, ...style,
    }}>
      {children}
    </div>
  );
}

export default Eyebrow;
