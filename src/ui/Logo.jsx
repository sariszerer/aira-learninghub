import React from "react";
import { AIRA_MARK_URI } from "../brand.js";

// Logotipo de AIRA. La imagen es apaisada (500x208, casi 2.4:1), asi que
// dimensionarla por altura la desborda de cualquier contenedor estrecho: a
// 26px de alto ocupaba 63px de ancho en un riel de 60. Aqui manda el ANCHO y la
// altura se deduce, que es lo que hace que quepa donde se la ponga.
function Logo({ width = 72, alt = "AIRA" }) {
  return (
    <img
      src={AIRA_MARK_URI}
      alt={alt}
      style={{ width, height: "auto", display: "block" }}
    />
  );
}

export default Logo;
