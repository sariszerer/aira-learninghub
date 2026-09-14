import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, X } from "lucide-react";
import { T } from "../theme.js";
import { datosDelPdf, nombreDelPdf, pdfComoBlob } from "../lib/adjuntos.js";

// El PDF adjunto, dentro de la aplicación.
//
// Antes se abría con window.open y el navegador la bloqueaba: "No se pudo
// abrir el PDF. Permite las ventanas emergentes de este sitio." La respuesta
// a eso no puede ser pedirle a once personas que cambien la configuración de
// su navegador, y en el teléfono — donde se usa — la instrucción ni siquiera
// aplica igual.
//
// Un <iframe> no es una ventana emergente: nadie lo bloquea, funciona en el
// móvil y deja el PDF al lado del expediente en vez de en otra pestaña. Los
// dos botones siguen estando para quien lo quiera aparte o guardado.
export default function VisorPdf({ fields, titulo, onClose }) {
  const datos = datosDelPdf(fields);
  const nombre = nombreDelPdf(fields);
  const [fallo, setFallo] = useState(null);

  // Una data: URL no se puede navegar ni incrustar en algunos navegadores;
  // como blob: sí, y además la descarga sale con nombre de archivo.
  const url = useMemo(() => {
    if (!datos) return null;
    if (!datos.startsWith("data:")) return datos;
    try {
      const blob = pdfComoBlob(datos);
      return blob ? URL.createObjectURL(blob) : null;
    } catch (e) {
      setFallo("El archivo adjunto está dañado y no se puede mostrar.");
      return null;
    }
  }, [datos]);

  useEffect(() => {
    if (!url || !url.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => {
    const alPulsar = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", alPulsar);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  const boton = {
    display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
    padding: "7px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.12)", color: "#fff",
    fontFamily: T.font, fontSize: 13, fontWeight: 600, textDecoration: "none",
  };

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1050, background: "rgba(17,24,39,0.82)",
        display: "flex", flexDirection: "column", padding: 14, gap: 12, fontFamily: T.font,
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0,
      }}>
        <div style={{ color: "#fff", fontSize: 14.5, fontWeight: 600, flex: 1, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {titulo || nombre}
        </div>
        {url && (
          <>
            <a href={url} download={nombre} style={boton}>
              <Download size={14} /> Descargar
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer" style={boton}>
              <ExternalLink size={14} /> Abrir aparte
            </a>
          </>
        )}
        <button onClick={onClose} aria-label="Cerrar" style={{ ...boton, padding: "7px 10px" }}>
          <X size={16} />
        </button>
      </div>

      {url ? (
        <iframe
          src={url}
          title={titulo || nombre}
          style={{ flex: 1, width: "100%", border: "none", borderRadius: 10, background: "#fff" }}
        />
      ) : (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fff", borderRadius: 10, color: T.inkSoft, fontSize: 14,
          padding: 24, textAlign: "center", lineHeight: 1.6,
        }}>
          {fallo || "Este documento no tiene ningún PDF adjunto."}
        </div>
      )}
    </div>,
    document.body
  );
}
