import React, { useState } from "react";
import { T, STATUS, inputStyle } from "../../theme.js";
import { NIVELES_GAS } from "../../lib/reportes.js";
import { Btn, Modal, ModalHeader, StatusIcon } from "../../ui/index.js";
import { EscalaGas } from "../../reports/piezas.jsx";

// Editor completo de un objetivo.
//
// Antes solo se podia cambiar el nombre, en linea sobre la fila. La
// especificacion de reportes pide la escala GAS en tres secciones distintas y
// la metodologia en el avance por objetivo, y cinco controles mas no caben en
// una fila de lista sin volverla ilegible.
//
// GAS puntua de -2 a +2 y 0 es la meta esperada. Los tres valores son
// opcionales: un objetivo sin escala sigue siendo valido y el reporte lo
// muestra con su semaforo. Obligarla convertiria cada objetivo nuevo en un
// formulario clinico completo.

const ESTADOS = ["logrado", "proceso", "apoyo"];

export default function ObjetivoModal({ objetivo, areasSugeridas = [], onGuardar, onClose }) {
  const nuevo = !objetivo?.id;
  const [form, setForm] = useState({
    name: objetivo?.name || "",
    area: objetivo?.area || areasSugeridas[0] || "",
    status: objetivo?.status || "proceso",
    gasBaseline: objetivo?.gasBaseline ?? null,
    gasTarget: objetivo?.gasTarget ?? null,
    gasCurrent: objetivo?.gasCurrent ?? null,
    methodology: objetivo?.methodology || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = () => {
    if (!form.name.trim()) return;
    onGuardar({
      ...objetivo,
      ...form,
      name: form.name.trim(),
      area: form.area.trim() || "General",
      methodology: form.methodology.trim() || null,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={600}>
      <ModalHeader
        title={nuevo ? "Nuevo objetivo" : "Editar objetivo"}
        subtitle={nuevo ? null : objetivo.name}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <Campo etiqueta="Objetivo">
          <input
            autoFocus value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Producir /r/ en posición inicial"
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
          />
        </Campo>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Campo etiqueta="Disciplina">
            <input
              value={form.area} onChange={(e) => set("area", e.target.value)}
              list="areas-sugeridas" placeholder="Ej: Fonoaudiología"
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />
            <datalist id="areas-sugeridas">
              {areasSugeridas.map((a) => <option key={a} value={a} />)}
            </datalist>
          </Campo>

          <Campo etiqueta="Estado">
            <div style={{ display: "flex", gap: 6 }}>
              {ESTADOS.map((e) => {
                const sel = form.status === e;
                return (
                  <button
                    key={e} type="button" onClick={() => set("status", e)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, flex: 1,
                      justifyContent: "center", padding: "8px 6px", borderRadius: 8,
                      cursor: "pointer", fontFamily: T.font, fontSize: 11.5,
                      fontWeight: sel ? 600 : 400,
                      border: `1.5px solid ${sel ? STATUS[e].color : T.border}`,
                      background: sel ? STATUS[e].tint : T.surface,
                      color: sel ? STATUS[e].color : T.inkSoft,
                    }}
                  >
                    <StatusIcon status={e} size={13} />
                    {STATUS[e].label}
                  </button>
                );
              })}
            </div>
          </Campo>
        </div>

        <div>
          <div style={etiquetaEstilo}>Escala GAS</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 10, lineHeight: 1.5 }}>
            Goal Attainment Scaling: 0 es la meta esperada. Es opcional — sin ella
            el reporte usa el estado de arriba. Aparece en el reporte de evolución
            y, traducida a palabras, en el de la familia.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SelectorGas
              etiqueta="Línea base" ayuda="Dónde estaba al definir el objetivo"
              valor={form.gasBaseline} onChange={(v) => set("gasBaseline", v)}
            />
            <SelectorGas
              etiqueta="Meta" ayuda="Nivel que se espera alcanzar"
              valor={form.gasTarget} onChange={(v) => set("gasTarget", v)}
            />
            <SelectorGas
              etiqueta="Nivel actual" ayuda="Dónde está hoy"
              valor={form.gasCurrent} onChange={(v) => set("gasCurrent", v)}
            />
          </div>

          {(form.gasBaseline != null || form.gasTarget != null || form.gasCurrent != null) && (
            <div style={{
              marginTop: 12, padding: "10px 12px", background: T.surfaceSunk,
              borderRadius: 8, display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600 }}>Así se verá:</span>
              <EscalaGas base={form.gasBaseline} meta={form.gasTarget} actual={form.gasCurrent} />
            </div>
          )}
        </div>

        <Campo etiqueta="Metodología">
          <textarea
            value={form.methodology} onChange={(e) => set("methodology", e.target.value)}
            rows={2}
            placeholder="Cómo se trabaja este objetivo. Ej: praxias con apoyo visual, 10 min por sesión."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
          />
        </Campo>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar} disabled={!form.name.trim()}>
          {nuevo ? "Crear objetivo" : "Guardar"}
        </Btn>
      </div>
    </Modal>
  );
}

// Cada nivel es un boton y no un desplegable: los cinco valores tienen
// significado clinico y verlos juntos es lo que permite elegir. Volver a pulsar
// el seleccionado lo desmarca, que es como se quita una escala puesta por error.
function SelectorGas({ etiqueta, ayuda, valor, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{etiqueta}</div>
        <div style={{ fontSize: 10.5, color: T.inkFaint, lineHeight: 1.3 }}>{ayuda}</div>
      </div>
      <div style={{ display: "flex", gap: 4, flex: 1, minWidth: 220 }}>
        {NIVELES_GAS.map((n) => {
          const sel = valor === n.valor;
          return (
            <button
              key={n.valor} type="button" title={n.label}
              onClick={() => onChange(sel ? null : n.valor)}
              style={{
                flex: 1, padding: "6px 2px", borderRadius: 7, cursor: "pointer",
                fontFamily: T.font, fontSize: 12, fontWeight: sel ? 700 : 500,
                border: `1.5px solid ${sel ? T.brand : T.border}`,
                background: sel ? T.brandTint : T.surface,
                color: sel ? T.brand : T.inkSoft,
              }}
            >
              {n.valor > 0 ? `+${n.valor}` : n.valor}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const etiquetaEstilo = {
  fontSize: 12, fontWeight: 700, color: T.inkFaint,
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
};

function Campo({ etiqueta, children }) {
  return (
    <div>
      <div style={etiquetaEstilo}>{etiqueta}</div>
      {children}
    </div>
  );
}
