import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { T } from "../theme.js";

// Tabla de datos con encabezado y orden por columna.
//
// El orden se resuelve aqui y no en cada pantalla: cada columna declara como
// extraer su valor (`valor`) y como pintarlo (`celda`), y la tabla se encarga
// del resto. Antes cada listado ordenaba a mano, casi siempre por una sola
// columna fija.
//
// Columnas: { clave, titulo, valor?, celda?, ancho?, alinear?, ordenable? }
//   valor  — para comparar. Si falta, se usa fila[clave].
//   celda  — para pintar. Si falta, se pinta el valor tal cual.
export default function Table({ columnas, filas, onFila, ordenInicial, vacio = "Sin resultados." }) {
  const [orden, setOrden] = useState(ordenInicial || null);

  const ordenadas = useMemo(() => {
    if (!orden) return filas;
    const col = columnas.find((c) => c.clave === orden.clave);
    if (!col) return filas;
    const de = (f) => (col.valor ? col.valor(f) : f[col.clave]);
    return [...filas].sort((a, b) => {
      const x = de(a), y = de(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;      // los vacios siempre al final, en ambos sentidos
      if (y == null) return -1;
      const c = typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y), "es");
      return orden.dir === "asc" ? c : -c;
    });
  }, [filas, orden, columnas]);

  const alternar = (clave) => {
    setOrden((o) => {
      if (!o || o.clave !== clave) return { clave, dir: "asc" };
      if (o.dir === "asc") return { clave, dir: "desc" };
      return null;                   // tercer clic: vuelve al orden original
    });
  };

  const grid = columnas.map((c) => c.ancho || "1fr").join(" ");

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.radius, boxShadow: T.shadow, overflow: "hidden",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: grid, gap: 12,
        padding: "10px 16px", background: T.surfaceSunk,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {columnas.map((c) => {
          const activa = orden?.clave === c.clave;
          const Icono = !activa ? ChevronsUpDown : orden.dir === "asc" ? ChevronUp : ChevronDown;
          const contenido = (
            <>
              {c.titulo}
              {c.ordenable !== false && (
                <Icono size={13} style={{ opacity: activa ? 1 : 0.4, flexShrink: 0 }} />
              )}
            </>
          );
          const estilo = {
            display: "flex", alignItems: "center", gap: 5,
            justifyContent: c.alinear === "derecha" ? "flex-end" : "flex-start",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
            textTransform: "uppercase", fontFamily: T.font,
            color: activa ? T.ink : T.inkSoft,
          };
          return c.ordenable === false
            ? <div key={c.clave} style={estilo}>{contenido}</div>
            : (
              <button
                key={c.clave}
                type="button"
                onClick={() => alternar(c.clave)}
                style={{ ...estilo, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {contenido}
              </button>
            );
        })}
      </div>

      {ordenadas.length === 0 ? (
        <div style={{ padding: "44px 20px", textAlign: "center", color: T.inkFaint, fontSize: 14 }}>
          {vacio}
        </div>
      ) : ordenadas.map((f, i) => (
        <div
          key={f.id ?? i}
          onClick={onFila ? () => onFila(f) : undefined}
          style={{
            display: "grid", gridTemplateColumns: grid, gap: 12, alignItems: "center",
            padding: "12px 16px", fontFamily: T.font, fontSize: 13.5, color: T.ink,
            borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}`,
            cursor: onFila ? "pointer" : "default",
            transition: "background .12s ease",
          }}
          onMouseEnter={onFila ? (e) => { e.currentTarget.style.background = T.surfaceSunk; } : undefined}
          onMouseLeave={onFila ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
        >
          {columnas.map((c) => (
            <div
              key={c.clave}
              style={{
                minWidth: 0,
                textAlign: c.alinear === "derecha" ? "right" : "left",
              }}
            >
              {c.celda ? c.celda(f) : (c.valor ? c.valor(f) : f[c.clave])}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
