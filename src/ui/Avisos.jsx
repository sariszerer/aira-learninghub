import React, { useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { T } from "../theme.js";
import { useAvisosStore } from "../store/avisosStore.js";

const DURACION_EXITO = 3500;

// Pila de avisos, abajo al centro y por encima de todo.
//
// Los errores no se desvanecen: el usuario puede estar mirando otro campo
// cuando pasan, y un error que se va solo es un error que no se leyó. Los de
// éxito sí, porque solo confirman.
export default function Avisos() {
  const avisos = useAvisosStore((s) => s.avisos);
  const descartar = useAvisosStore((s) => s.descartar);
  if (!avisos.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
      zIndex: 400, width: "min(560px, calc(100vw - 32px))",
      display: "flex", flexDirection: "column", gap: 9,
    }}>
      {avisos.map((a) => (
        <Aviso key={a.id} aviso={a} onCerrar={() => descartar(a.id)} />
      ))}
    </div>
  );
}

function Aviso({ aviso, onCerrar }) {
  const esError = aviso.tono === "error";

  // El temporizador se reinicia con `en`: si la misma acción vuelve a
  // confirmarse, el aviso se queda otros segundos en vez de irse a medias.
  useEffect(() => {
    if (esError) return undefined;
    const t = setTimeout(onCerrar, DURACION_EXITO);
    return () => clearTimeout(t);
  }, [esError, aviso.en, onCerrar]);

  const tinta = esError ? T.apoyo : T.logrado;
  return (
    <div
      role={esError ? "alert" : "status"}
      style={{
        background: "#fff", color: T.ink, fontFamily: T.font,
        border: `1px solid ${tinta}`, borderLeft: `5px solid ${tinta}`,
        borderRadius: 13, padding: "13px 15px",
        boxShadow: "0 14px 40px rgba(21,47,54,0.24)",
        display: "flex", alignItems: "flex-start", gap: 11,
      }}
    >
      {esError
        ? <AlertTriangle size={18} color={tinta} style={{ flexShrink: 0, marginTop: 1 }} />
        : <Check size={18} color={tinta} strokeWidth={3} style={{ flexShrink: 0, marginTop: 1 }} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{aviso.que}</div>
        {aviso.detalle && (
          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3, lineHeight: 1.45, wordBreak: "break-word" }}>
            {aviso.detalle}
          </div>
        )}
      </div>

      <button
        onClick={onCerrar} aria-label="Cerrar aviso"
        style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 2, lineHeight: 0, flexShrink: 0 }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
