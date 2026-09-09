import React, { useRef, useState } from "react";
import { PenLine, Upload } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { TODAY } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { SeccionDoc } from "./piezas.jsx";
import { estadoDeFirma, validarArchivoDeFirma } from "./firma.js";

// Bloque de firma de los tres reportes.
//
// La rúbrica se guarda una vez en el perfil del especialista y se reutiliza; lo
// que se decide en cada documento es si se estampa. Firmar es un acto del
// profesional, así que el botón solo aparece cuando quien tiene la sesión
// abierta ES el responsable del reporte. Para cualquier otro se imprime la
// línea en blanco de siempre, que es lo que permite firmar a mano.
//
// Los controles llevan no-imprimir: un botón dentro de un PDF entregado a una
// familia se lee como un documento a medio hacer.
export default function BloqueFirma({ responsable, datos = [] }) {
  const firmante = useAuthStore((s) => s.currentUser);
  const actualizarUsuario = useDataStore((s) => s.updateUser);
  const [aplicada, setAplicada] = useState(false);
  const [error, setError] = useState(null);
  const entrada = useRef(null);

  const estado = estadoDeFirma({ firmante, responsable, aplicada });

  const subir = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    const problema = validarArchivoDeFirma(archivo);
    if (problema) { setError(problema); return; }
    setError(null);
    const lector = new FileReader();
    lector.onload = async () => {
      try {
        // Se guarda en el perfil, no en el reporte: la misma rúbrica vale para
        // los tres documentos y para los de mañana.
        await actualizarUsuario(responsable.id, { firma: lector.result });
        setAplicada(true);
      } catch {
        // El aviso de fallo lo publica el store.
      }
    };
    lector.readAsDataURL(archivo);
  };

  return (
    <SeccionDoc titulo="Firma y validación">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", fontSize: 11.5, marginTop: 22 }}>
        <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
          {estado === "firmada" && responsable?.firma && (
            <img
              src={responsable.firma} alt={`Firma de ${responsable.name}`}
              style={{ maxHeight: 62, maxWidth: 260, display: "block", marginBottom: -6 }}
            />
          )}
          {estado === "puede" && (
            <div className="no-imprimir" style={{ marginBottom: 6 }}>
              <button
                type="button" onClick={() => setAplicada(true)}
                style={botonFirma}
              >
                <PenLine size={13} /> Firmar este reporte
              </button>
              <span style={{ marginLeft: 9, fontSize: 11, color: T.inkFaint }}>
                Se estampa tu firma antes de descargar.
              </span>
            </div>
          )}
          {estado === "sin_firma" && (
            <div className="no-imprimir" style={{ marginBottom: 6 }}>
              <button type="button" onClick={() => entrada.current?.click()} style={botonFirma}>
                <Upload size={13} /> Cargar mi firma
              </button>
              <span style={{ marginLeft: 9, fontSize: 11, color: T.inkFaint }}>
                PNG con fondo transparente. Queda guardada en tu perfil.
              </span>
              <input
                ref={entrada} type="file" accept="image/png,image/jpeg,image/webp"
                onChange={subir} style={{ display: "none" }}
              />
              {error && (
                <div style={{ fontSize: 11, color: T.apoyo, marginTop: 5 }}>{error}</div>
              )}
            </div>
          )}
        </div>

        <FirmaLinea etiqueta="Especialista" valor={responsable?.name} />
        {datos.map((d) => (
          <FirmaLinea key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} faltante={d.faltante} />
        ))}
        <FirmaLinea etiqueta="Fecha" valor={fmtDate(TODAY)} />
      </div>
    </SeccionDoc>
  );
}

const botonFirma = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "5px 11px", borderRadius: 7, cursor: "pointer",
  border: `1px solid ${T.brand}`, background: T.brandTint,
  color: T.brand, fontFamily: T.font, fontSize: 12, fontWeight: 600,
};

export function FirmaLinea({ etiqueta, valor, faltante }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ borderBottom: `1px solid ${T.ink}`, height: 18 }} />
      <div style={{ fontSize: 9.5, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: 3 }}>
        {etiqueta}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: valor ? T.ink : T.inkFaint, fontStyle: valor ? "normal" : "italic" }}>
        {valor || faltante || "—"}
      </div>
    </div>
  );
}
