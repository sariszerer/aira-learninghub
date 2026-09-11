import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { T } from "../theme.js";
import { useEsMovil } from "../lib/pantalla.js";

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
// Una celda se pinta igual en tabla y en ficha; tenerlo dos veces era garantia
// de que se separaran.
function celdaDe(c, f) {
  if (c.celda) return c.celda(f);
  if (c.valor) return c.valor(f);
  return f[c.clave];
}

// El orden puede llevarlo la tabla o la pantalla. Si llega `orden`, manda la
// pantalla: hay listados que ofrecen atajos de orden fuera de la tabla — "los
// creados mas recientes" — y con dos estados se desincronizan, de modo que el
// atajo marcado y la flecha del encabezado acaban diciendo cosas distintas.
// Que orden sigue al pulsar el encabezado `clave`.
//
// Tres clics sobre la misma columna: ascendente, descendente, y de vuelta al
// orden original. Pulsar otra columna empieza su ciclo de cero.
export function siguienteOrden(orden, clave) {
  if (!orden || orden.clave !== clave) return { clave, dir: "asc" };
  if (orden.dir === "asc") return { clave, dir: "desc" };
  return null;
}

export default function Table({ columnas, filas, onFila, ordenInicial, orden: ordenDeFuera, onOrden, vacio = "Sin resultados." }) {
  const esMovil = useEsMovil();
  const [ordenPropio, setOrdenPropio] = useState(ordenInicial || null);
  const controlada = ordenDeFuera !== undefined;
  const orden = controlada ? ordenDeFuera : ordenPropio;
  const aplicarOrden = (o) => {
    if (!controlada) setOrdenPropio(o);
    if (onOrden) onOrden(o);
  };

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

  const alternar = (clave) => aplicarOrden(siguienteOrden(orden, clave));

  // En movil se dejan solo las columnas esenciales y la fila se apila.
  //
  // Seis columnas en 390px no son una tabla: son seis tiras de dos caracteres.
  // Cada fila pasa a ser una ficha en tres alturas:
  //
  //   1. la primera columna a todo el ancho — es el nombre, lo que identifica
  //   2. el resto como pares etiqueta/valor, que caben y se leen
  //   3. los botones en su propia linea
  //
  // Los botones abajo y no arriba porque compartir fila con el nombre le dejaba
  // 140px de los 390 y el correo se metia por debajo de ellos.
  const primera = columnas[0];
  const acciones = columnas.filter((c) => c.accion);
  const datos = columnas.filter((c) => c !== primera && !c.accion);

  const grid = columnas.map((c) => c.ancho || "1fr").join(" ");

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.radius, boxShadow: T.shadow, overflow: "hidden",
    }}>
      {/* En modo ficha no hay columnas que encabezar. Se deja solo el orden
          por la primera, que es por lo que se busca. */}
      <div style={{
        display: "grid",
        gridTemplateColumns: esMovil ? "1fr" : grid, gap: 12,
        padding: "10px 16px", background: T.surfaceSunk,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {(esMovil ? [primera] : columnas).map((c) => {
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
            padding: "12px 16px", fontFamily: T.font, fontSize: 13.5, color: T.ink,
            borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}`,
            cursor: onFila ? "pointer" : "default",
            transition: "background .12s ease",
          }}
          onMouseEnter={onFila ? (e) => { e.currentTarget.style.background = T.surfaceSunk; } : undefined}
          onMouseLeave={onFila ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
        >
          {esMovil ? (
            <>
              <div style={{ minWidth: 0 }}>
                {celdaDe(primera, f)}
              </div>

              {datos.length > 0 && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 7,
                  fontSize: 12.5, color: T.inkSoft,
                }}>
                  {datos.map((c) => (
                    <span key={c.clave} style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      {/* Con su etiqueta delante: un "20" suelto no dice si son
                          pacientes o sesiones. */}
                      {c.titulo && <span style={{ color: T.inkFaint, fontSize: 11 }}>{c.titulo}</span>}
                      {celdaDe(c, f)}
                    </span>
                  ))}
                </div>
              )}

              {acciones.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  {acciones.map((c) => (
                    <div key={c.clave} style={{ minWidth: 0 }}>{celdaDe(c, f)}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, alignItems: "center" }}>
              {columnas.map((c) => (
                <div
                  key={c.clave}
                  style={{
                    minWidth: 0,
                    textAlign: c.alinear === "derecha" ? "right" : "left",
                  }}
                >
                  {celdaDe(c, f)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
