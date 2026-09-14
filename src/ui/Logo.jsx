import React from "react";
import { AIRA_MARK_URI, AIRA_LOGO_FULL_URI } from "../brand.js";

// Logotipo de AIRA. La imagen es apaisada (500x208, casi 2.4:1), asi que
// dimensionarla por altura la desborda de cualquier contenedor estrecho: a
// 26px de alto ocupaba 63px de ancho en un riel de 60. Aqui manda el ANCHO y la
// altura se deduce, que es lo que hace que quepa donde se la ponga.
//
// `completo` da el bloque de marca entero — "Aira" mas "Learning Hub" — que es
// el que lleva el membrete del centro. En la aplicacion basta la firma corta,
// porque el nombre ya esta en la barra; en un documento que sale del centro no,
// ahi tiene que leerse quien lo emite.
function Logo({ width = 72, alt = "AIRA", completo = false }) {
  return (
    <img
      src={completo ? AIRA_LOGO_FULL_URI : AIRA_MARK_URI}
      alt={completo ? "AIRA Learning Hub" : alt}
      style={{ width, height: "auto", display: "block" }}
    />
  );
}

export default Logo;
