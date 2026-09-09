import React from "react";
import { T } from "../theme.js";
import { contar } from "../lib/format.js";
import { DIAS, esDelMes } from "../lib/semana.js";

// El mes completo: para ver cómo va la carga, no el detalle de una cita.
//
// La versión obvia — listar las tres primeras citas de cada día y poner "+N
// más" — aquí no sirve. En este centro TODOS los días con actividad pasan de
// tres: entre 15 y 19 citas diarias. Se leerían tres nombres arbitrarios y un
// "+16 más" en cada celda, treinta veces.
//
// Así que el mes responde a lo que un mes puede responder: qué días están
// cargados, cuáles tienen hueco, y quién está fuera. El detalle está a un clic,
// en la vista de Día.

// Cuántas citas se consideran un día lleno. Sale del propio calendario: los
// días más cargados del centro rondan las 19.
const LLENO = 18;

export default function RejillaMes({ dias, mes, porDia, hoy, onElegirDia, color }) {
  const semanas = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 6 }}>
        {DIAS.map((d) => (
          <div key={d} style={{
            fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em",
            fontWeight: 700, color: T.inkFaint, textAlign: "center", padding: "2px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{
        display: "grid", gap: 1, background: T.border,
        border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden",
        gridTemplateRows: `repeat(${semanas.length}, minmax(88px, auto))`,
      }}>
        {semanas.map((semana) => (
          <div key={semana[0]} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {semana.map((d) => {
              const delMes = esDelMes(d, mes);
              const esHoy = d === hoy;
              const todo = porDia.get(d) || [];
              const citas = todo.filter((e) => !e.diaCompleto);
              const ausencias = todo.filter((e) => e.diaCompleto);
              const carga = Math.min(1, citas.length / LLENO);

              return (
                <button
                  key={d} type="button" onClick={() => onElegirDia(d)}
                  title={citas.length ? `${d} · ${contar(citas.length, "cita", "citas")}` : d}
                  style={{
                    display: "flex", flexDirection: "column", gap: 5, minWidth: 0,
                    padding: "7px 8px", border: "none", cursor: "pointer",
                    textAlign: "left", fontFamily: T.font,
                    // Los días prestados del mes vecino se apagan, pero llevan
                    // sus datos: son días reales del centro.
                    background: esHoy ? T.brandTint : delMes ? T.surface : T.surfaceSunk,
                    opacity: delMes ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                    <span style={{
                      fontSize: 12.5, fontWeight: esHoy ? 700 : 600,
                      color: esHoy ? T.brand : T.ink,
                    }}>
                      {Number(d.slice(8, 10))}
                    </span>
                    {citas.length > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: T.inkSoft,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {citas.length}
                      </span>
                    )}
                  </div>

                  {/* Barra de carga. Es lo que se lee de un vistazo a escala de
                      mes: dónde hay hueco y dónde no. */}
                  {citas.length > 0 && (
                    <div style={{ height: 4, borderRadius: 999, background: T.surfaceSunk, overflow: "hidden" }}>
                      <div style={{
                        width: `${carga * 100}%`, height: "100%", borderRadius: 999,
                        background: carga >= 0.9 ? T.apoyo : carga >= 0.6 ? T.proceso : T.logrado,
                      }} />
                    </div>
                  )}

                  {/* Las ausencias sí van con nombre: a escala de mes, quién
                      está fuera es la información que se busca. */}
                  {ausencias.slice(0, 2).map((e) => (
                    <span key={e.id} title={e.title} style={{
                      display: "block", fontSize: 10, lineHeight: 1.3,
                      padding: "1px 5px", borderRadius: 4, minWidth: 0,
                      background: `${color(e.title)}1A`, color: color(e.title),
                      fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {e.title}
                    </span>
                  ))}
                  {ausencias.length > 2 && (
                    <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 600 }}>
                      +{ausencias.length - 2}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11.5, color: T.inkFaint, flexWrap: "wrap" }}>
        <Leyenda color={T.logrado} texto="Día con hueco" />
        <Leyenda color={T.proceso} texto="Cargado" />
        <Leyenda color={T.apoyo} texto="Lleno" />
        <span>Pulsa un día para verlo en detalle.</span>
      </div>
    </div>
  );
}

function Leyenda({ color, texto }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 14, height: 4, borderRadius: 999, background: color }} />
      {texto}
    </span>
  );
}
