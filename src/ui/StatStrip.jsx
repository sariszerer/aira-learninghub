import React from "react";
import { T } from "../theme.js";

// Fila de metricas principales. Pasa de una tira segmentada a tarjetas
// independientes: cada cifra se lee sola, y hay sitio para un icono y una
// variacion sin apretar el numero.
//
// Cada item admite { label, value, icon, tone, delta, deltaLabel }. Solo label
// y value son obligatorios, asi que las llamadas existentes siguen sirviendo.
const TONOS = {
  brand: { fg: T.brand, bg: T.brandTint },
  cyan: { fg: T.amberDeep, bg: T.amberTint },
  violet: { fg: T.pinkDeep, bg: T.pinkTint },
  ok: { fg: T.logrado, bg: T.logradoTint },
  warn: { fg: T.proceso, bg: T.procesoTint },
  alert: { fg: T.apoyo, bg: T.apoyoTint },
};

const ORDEN_TONOS = ["brand", "cyan", "violet", "ok"];

function StatStrip({ items }) {
  return (
    <div style={{
      display: "grid", gap: 14, marginBottom: 24,
      gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
    }}>
      {items.map((it, i) => {
        const tono = TONOS[it.tone] || TONOS[ORDEN_TONOS[i % ORDEN_TONOS.length]];
        const Icon = it.icon;
        const sube = typeof it.delta === "number" && it.delta >= 0;
        return (
          <div key={it.label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radius, boxShadow: T.shadow, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              {Icon && (
                <div style={{
                  width: 26, height: 26, borderRadius: 7, background: tono.bg,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  <Icon size={14} color={tono.fg} strokeWidth={2.2} />
                </div>
              )}
              <div style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 500 }}>{it.label}</div>
            </div>

            <div style={{
              fontSize: 27, fontWeight: 700, color: T.ink,
              letterSpacing: "-0.025em", lineHeight: 1.1,
            }}>
              {it.value}
            </div>

            {it.delta != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: sube ? T.logrado : T.apoyo,
                }}>
                  {sube ? "↑" : "↓"} {Math.abs(it.delta)}%
                </span>
                <span style={{ fontSize: 11.5, color: T.inkFaint }}>
                  {it.deltaLabel || "vs. mes anterior"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StatStrip;
