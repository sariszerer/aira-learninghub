import React from "react";
import { T } from "../theme.js";

// Lista de filas separadas dentro de una tarjeta.
//
// Existe porque el separador se estaba resolviendo de tres formas distintas en
// la misma aplicacion: borderTop en unas pantallas, borderBottom en otras, y en
// algunas sobre TODAS las filas — lo que deja una linea colgando contra el
// borde de la tarjeta.
//
// La convencion es una sola: borde ARRIBA en todas menos la primera. Es la
// unica que nunca deja linea suelta, ni arriba ni abajo, sin tener que saber
// cuantas filas hay.
export function List({ children, style }) {
  const filas = React.Children.toArray(children).filter(Boolean);
  return (
    <div style={style}>
      {filas.map((hijo, i) =>
        React.isValidElement(hijo)
          ? React.cloneElement(hijo, { primera: i === 0, key: hijo.key ?? i })
          : hijo,
      )}
    </div>
  );
}

// Una fila. `primera` la inyecta List: no se pasa a mano.
export function ListRow({ children, onClick, primera, style, align = "center" }) {
  // Los cuatro lados se declaran por separado y nunca junto al atajo `border`:
  // mezclarlos hace que React avise de propiedades en conflicto al re-renderizar,
  // y el resultado depende del orden en que se apliquen.
  const base = {
    display: "flex",
    alignItems: align,
    gap: 11,
    padding: "11px 16px",
    borderTopStyle: "solid",
    borderTopWidth: primera ? 0 : 1,
    borderTopColor: T.borderSoft,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    fontFamily: T.font,
    textAlign: "left",
    width: "100%",
    background: "transparent",
    ...style,
  };

  if (!onClick) return <div style={base}>{children}</div>;

  return (
    <button type="button" onClick={onClick} style={{ ...base, cursor: "pointer" }}>
      {children}
    </button>
  );
}

export default List;
