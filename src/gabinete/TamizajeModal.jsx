import React, { useState } from "react";
import { T, TODAY, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Btn, Chip, Modal, ModalHeader } from "../ui/index.js";
import { RESULTADOS, RUTAS, tonoDe } from "./preescolar.js";

// Registro de un tamizaje y la decisión que sale de él.
//
// Las dos cosas van en la misma pantalla a propósito: un tamizaje cuyo
// resultado no se traduce en una ruta deja el caso parado, y separarlos en dos
// pasos garantiza que alguien haga el primero y olvide el segundo.
//
// Los ítems del instrumento todavía no están definidos, así que por ahora se
// registran las áreas de alerta como texto libre y el detalle queda vacío. La
// columna `detalle` en la base ya lo espera: cuando llegue el instrumento se
// añade aquí sin tocar el esquema.

export default function TamizajeModal({ estudiante, onClose }) {
  const guardarTamizaje = useDataStore((s) => s.guardarTamizaje);
  const guardarEstudiante = useDataStore((s) => s.guardarEstudianteGabinete);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [f, setF] = useState({
    fecha: TODAY,
    instrumento: "",
    resultado: "pendiente",
    areas: "",
    observaciones: "",
    recomendacion: "",
  });
  // La ruta arranca en la que ya tiene: registrar un tamizaje de seguimiento no
  // debe proponer cambiarla si nadie lo decidió.
  const [ruta, setRuta] = useState(estudiante.ruta || "sin_evaluar");
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarTamizaje({
        studentId: estudiante.id,
        fecha: f.fecha,
        instrumento: f.instrumento.trim() || null,
        aplicadoPor: currentUser?.id || null,
        resultado: f.resultado,
        areasAlerta: f.areas.split(",").map((a) => a.trim()).filter(Boolean),
        observaciones: f.observaciones.trim() || null,
        recomendacion: f.recomendacion.trim() || null,
      });
      if (ruta !== estudiante.ruta) {
        await guardarEstudiante({ ...estudiante, ruta, fechaRuta: f.fecha });
      }
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHeader
        title="Registrar tamizaje"
        subtitle={`${estudiante.name} ${estudiante.lastName || ""}${estudiante.nivel ? ` · ${estudiante.nivel}` : ""}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "66vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Campo etiqueta="Fecha">
            <input type="date" value={f.fecha} onChange={(e) => set("fecha", e.target.value)}
                   style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </Campo>
          <Campo etiqueta="Instrumento">
            <input value={f.instrumento} onChange={(e) => set("instrumento", e.target.value)}
                   placeholder="Nombre de la prueba aplicada"
                   style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </Campo>
        </div>

        <Campo etiqueta="Resultado">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(RESULTADOS).map(([clave, r]) => {
              const sel = f.resultado === clave;
              const tono = tonoDe(r.tono, T);
              return (
                <button
                  key={clave} type="button" onClick={() => set("resultado", clave)}
                  style={{
                    padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                    fontFamily: T.font, fontSize: 12.5, fontWeight: sel ? 700 : 400,
                    border: `1.5px solid ${sel ? tono.color : T.border}`,
                    background: sel ? tono.fondo : T.surface,
                    color: sel ? tono.color : T.inkSoft,
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Campo>

        <Campo etiqueta="Áreas de alerta" ayuda="Separadas por comas. Ej: lenguaje, motricidad fina">
          <input value={f.areas} onChange={(e) => set("areas", e.target.value)}
                 style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </Campo>

        <Campo etiqueta="Observaciones">
          <textarea value={f.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={3}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </Campo>

        <Campo etiqueta="Recomendación">
          <textarea value={f.recomendacion} onChange={(e) => set("recomendacion", e.target.value)} rows={2}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </Campo>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <Campo
            etiqueta="Qué se hace con el caso"
            ayuda="Un tamizaje sin decisión deja el caso parado. Si se deriva al centro, después habrá que abrirle expediente."
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(RUTAS)
                .sort((a, b) => a[1].orden - b[1].orden)
                .map(([clave, r]) => (
                  <Chip key={clave} label={r.label} selected={ruta === clave} onClick={() => setRuta(clave)} />
                ))}
            </div>
          </Campo>
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar tamizaje"}</Btn>
      </div>
    </Modal>
  );
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
      }}>
        {etiqueta}
      </div>
      {ayuda && <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 6, lineHeight: 1.5 }}>{ayuda}</div>}
      {children}
    </div>
  );
}
