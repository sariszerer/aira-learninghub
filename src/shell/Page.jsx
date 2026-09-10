import React from "react";
import { T } from "../theme.js";
import PageHeader from "./PageHeader.jsx";
import { useEsMovil, paddingPagina } from "../lib/pantalla.js";

// Contenedor de pantalla. Existe porque convivian dos sistemas: las vistas
// nuevas usaban PageHeader a ancho completo con 28px de margen, y las demas
// centraban su contenido con anchos maximos distintos — 680, 860, 980 y 1060 —
// y otro padding. El resultado era que el contenido saltaba de sitio al cambiar
// de seccion.
//
// A ancho completo, como el panel de referencia: el area de trabajo ya la
// delimita el menu lateral.
export default function Page({ titulo, subtitulo, buscar, onBuscar, acciones, children }) {
  const esMovil = useEsMovil();
  return (
    <>
      {titulo && (
        <PageHeader
          titulo={titulo}
          subtitulo={subtitulo}
          buscar={buscar}
          onBuscar={onBuscar}
          acciones={acciones}
        />
      )}
      <div style={{ padding: paddingPagina(esMovil), fontFamily: T.font }}>
        {children}
      </div>
    </>
  );
}
