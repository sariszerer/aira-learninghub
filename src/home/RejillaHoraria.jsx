import React from "react";
import { T } from "../theme.js";
import { DIAS, franjaHoraria, repartirSolapes } from "../lib/semana.js";

// Rejilla de horas con las citas colocadas por su hora real.
//
// Sirve para un día y para una semana: cambia el número de columnas, no el
// dibujo. Es lo que una lista no puede enseñar — dónde está el hueco, qué se
// pisa y cuánto dura cada cosa.

const ALTO_HORA = 52;
const ANCHO_HORAS = 52;

export default function RejillaHoraria({ dias, eventos, hoy, onElegirDia, onElegirEvento, seleccionado, color }) {
  const franja = franjaHoraria(eventos);
  const horas = [];
  for (let h = franja.desde; h < franja.hasta; h++) horas.push(h);
  const alto = horas.length * ALTO_HORA;

  const conHora = repartirSolapes(eventos.filter((e) => !e.diaCompleto));
  const completos = eventos.filter((e) => e.diaCompleto);

  return (
    <div>
      {/* Los de día completo no caben en la rejilla — no tienen hora — y son
          justo los que más importa ver de un vistazo: quién está de vacaciones.
          Van en su propia banda arriba. */}
      {completos.length > 0 && (
        <div style={{ display: "flex", gap: 1, marginBottom: 8, paddingLeft: ANCHO_HORAS }}>
          {dias.map((d) => (
            <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              {completos.filter((e) => e.fecha === d).map((e) => (
                <div key={e.id} title={e.title} style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 7px", borderRadius: 6,
                  background: `${color(e.title)}1F`, color: color(e.title),
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {e.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Cabecera de días. En semana se puede pulsar para bajar a ese día. */}
      {dias.length > 1 && (
        <div style={{ display: "flex", gap: 1, marginBottom: 6, paddingLeft: ANCHO_HORAS }}>
          {dias.map((d, i) => {
            const esHoy = d === hoy;
            return (
              <button
                key={d} type="button" onClick={() => onElegirDia?.(d)}
                style={{
                  flex: 1, minWidth: 0, padding: "5px 4px", borderRadius: 8, cursor: "pointer",
                  border: "none", fontFamily: T.font, textAlign: "center",
                  background: esHoy ? T.brandTint : "transparent",
                  color: esHoy ? T.brand : T.inkSoft,
                }}
              >
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  {DIAS[i]}
                </div>
                <div style={{ fontSize: 15, fontWeight: esHoy ? 700 : 500, color: esHoy ? T.brand : T.ink }}>
                  {Number(d.slice(8, 10))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", position: "relative", height: alto }}>
        {/* Columna de horas */}
        <div style={{ width: ANCHO_HORAS, flexShrink: 0, position: "relative" }}>
          {horas.map((h, i) => (
            <div key={h} style={{
              position: "absolute", top: i * ALTO_HORA - 6, right: 8,
              fontSize: 10.5, color: T.inkFaint, fontVariantNumeric: "tabular-nums",
            }}>
              {etiquetaHora(h)}
            </div>
          ))}
        </div>

        {/* Días */}
        <div style={{ flex: 1, display: "flex", gap: 1, position: "relative", minWidth: 0 }}>
          {/* Líneas de hora, detrás de todo */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {horas.map((h, i) => (
              <div key={h} style={{
                position: "absolute", left: 0, right: 0, top: i * ALTO_HORA,
                borderTop: `1px solid ${T.borderSoft}`,
              }} />
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTop: `1px solid ${T.borderSoft}` }} />
          </div>

          {dias.map((d) => (
            <div key={d} style={{
              flex: 1, minWidth: 0, position: "relative",
              background: d === hoy && dias.length > 1 ? `${T.brand}08` : "transparent",
            }}>
              {conHora.filter((e) => e.fecha === d).map((e) => {
                const arriba = ((e.inicioMin - franja.desde * 60) / 60) * ALTO_HORA;
                // Un mínimo de alto: una cita de 15 minutos sin él sale como una
                // raya sin texto legible.
                const altoEv = Math.max(22, ((e.finMin - e.inicioMin) / 60) * ALTO_HORA - 2);
                const ancho = 100 / e.columnas;
                const activo = seleccionado === e.id;
                const c = color(e.title);
                return (
                  <button
                    key={e.id} type="button" onClick={() => onElegirEvento?.(e)}
                    title={`${e.time} · ${e.title}`}
                    style={{
                      position: "absolute", top: arriba, height: altoEv,
                      left: `${e.columna * ancho}%`, width: `calc(${ancho}% - 2px)`,
                      borderRadius: 7, padding: "3px 6px", overflow: "hidden",
                      textAlign: "left", cursor: "pointer", fontFamily: T.font,
                      background: activo ? c : `${c}1F`,
                      color: activo ? "#fff" : T.ink,
                      border: `1px solid ${activo ? c : `${c}55`}`,
                      borderLeft: `3px solid ${c}`,
                      textDecoration: e.cancelled ? "line-through" : "none",
                      opacity: e.cancelled ? 0.55 : 1,
                    }}
                  >
                    <div style={{
                      fontSize: 11.5, fontWeight: 600, lineHeight: 1.25,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {e.title}
                    </div>
                    {altoEv > 34 && (
                      <div style={{ fontSize: 10.5, opacity: 0.8, whiteSpace: "nowrap" }}>{e.time}</div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function etiquetaHora(h) {
  const ampm = h < 12 ? "AM" : "PM";
  const doce = h % 12 === 0 ? 12 : h % 12;
  return `${doce} ${ampm}`;
}
