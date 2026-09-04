import React from "react";
import { T } from "../theme.js";

// Lista de filas.
//
// Dos formas, y la que manda es la primera:
//
//   "tarjetas" (por defecto) — cada fila es una caja blanca separada sobre el
//   fondo gris, como los elementos del menu lateral. Sin lineas divisorias:
//   el hueco entre filas ya las separa, y una caja se puede resaltar al pasar
//   el raton o al estar activa sin depender de bordes.
//
//   "lineas" — filas pegadas con un hilo entre ellas. Se conserva para tablas
//   densas donde el hueco entre tarjetas gastaria demasiado alto.
//
// La convencion del separador en modo "lineas" es borde ARRIBA en todas menos
// la primera: es la unica que nunca deja una linea colgando contra el borde del
// contenedor, sin tener que saber cuantas filas hay.
export function List({ children, variant = "tarjetas", style }) {
  const filas = React.Children.toArray(children).filter(Boolean);
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      gap: variant === "tarjetas" ? 8 : 0,
      ...style,
    }}>
      {filas.map((hijo, i) =>
        React.isValidElement(hijo)
          ? React.cloneElement(hijo, { primera: i === 0, variant, key: hijo.key ?? i })
          : hijo,
      )}
    </div>
  );
}

// Una fila. `primera` y `variant` los inyecta List: no se pasan a mano.
export function ListRow({
  children, onClick, primera, variant = "tarjetas", activa, style, align = "center",
}) {
  const tarjeta = variant === "tarjetas";

  // Los cuatro lados se declaran por separado y nunca junto al atajo `border`:
  // mezclarlos hace que React avise de propiedades en conflicto al re-renderizar.
  const base = {
    display: "flex",
    alignItems: align,
    gap: 11,
    width: "100%",
    textAlign: "left",
    fontFamily: T.font,
    padding: tarjeta ? "11px 14px" : "11px 16px",
    borderRadius: tarjeta ? T.radiusSm : 0,
    background: tarjeta ? T.surface : "transparent",
    boxShadow: tarjeta ? T.shadow : "none",
    borderStyle: "solid",
    borderColor: tarjeta ? (activa ? T.brand : T.border) : T.borderSoft,
    borderTopWidth: tarjeta ? 1 : (primera ? 0 : 1),
    borderRightWidth: tarjeta ? 1 : 0,
    borderBottomWidth: tarjeta ? 1 : 0,
    borderLeftWidth: tarjeta ? 1 : 0,
    ...style,
  };

  if (!onClick) return <div style={base}>{children}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...base, cursor: "pointer", transition: "box-shadow .15s ease, border-color .15s ease" }}
      onMouseEnter={(e) => {
        if (!tarjeta) return;
        e.currentTarget.style.boxShadow = T.shadowLift;
        e.currentTarget.style.borderColor = T.brand;
      }}
      onMouseLeave={(e) => {
        if (!tarjeta) return;
        e.currentTarget.style.boxShadow = T.shadow;
        e.currentTarget.style.borderColor = activa ? T.brand : T.border;
      }}
    >
      {children}
    </button>
  );
}

export default List;
