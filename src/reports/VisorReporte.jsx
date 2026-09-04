import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { T } from "../theme.js";
import { Btn, IconBtn } from "../ui/index.js";

// Visor a pantalla completa de un reporte, con el mismo diseno que tendra el
// PDF. El documento lo pide asi: "(1) previsualizarse en pantalla dentro del
// panel administrativo, con el mismo diseno de marca que llevara el PDF, y (2)
// descargarse como PDF con un boton 'Descargar PDF'".
//
// El PDF sale del motor de impresion del navegador y no de una libreria. Es
// deliberado: da texto seleccionable y buscable, respeta los saltos de pagina
// que declaran las piezas, pesa lo que pesa el HTML y no anade dependencias.
// Rasterizar con html2canvas produciria una imagen de varios MB que no se puede
// copiar ni indexar — en un expediente clinico eso importa.
//
// Corrige ademas un boton que nunca funciono: los tres reportes llamaban a
// window.print() sin ninguna hoja de impresion, asi que mandaban a la impresora
// la aplicacion entera, barra lateral incluida.
//
// Se monta con portal directo a <body>. No es un detalle de estilo: al imprimir
// hay que ocultar el resto con display:none para que el reporte quede en flujo
// normal y PAGINE. La alternativa habitual — visibility:hidden mas
// position:absolute — deja el documento fuera de flujo, y un historial largo se
// corta al final de la primera pagina en vez de continuar en la segunda.

// Se exporta como cadena para que una prueba pueda aplicar las mismas reglas
// sin el @media print y comprobar que aislan de verdad. Es la unica forma de
// mirar el resultado impreso sin abrir el dialogo del navegador.
export const CSS_IMPRESION = `
      @media print {
        body > *:not(.visor-portal) { display: none !important; }
        .visor-portal { position: static !important; }
        .visor-overlay {
          position: static !important; inset: auto !important;
          background: none !important; padding: 0 !important;
          overflow: visible !important; display: block !important;
        }
        .visor-hoja {
          max-width: none !important; width: auto !important;
          box-shadow: none !important; border-radius: 0 !important;
          padding: 0 !important; margin: 0 !important;
        }
        .no-imprimir { display: none !important; }
        .solo-impresion { display: block !important; }
        /* Los fondos de cabecera de tabla y de los indicadores no son
           decoracion: sin esto el navegador los descarta y el PDF sale sin
           ninguna jerarquia visual. */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
      @page { size: A4; margin: 14mm 12mm; }
      @media screen { .solo-impresion { display: none; } }
`;

function EstilosImpresion() {
  return <style>{CSS_IMPRESION}</style>;
}

export default function VisorReporte({ titulo, onClose, acciones, children }) {
  useEffect(() => {
    const alPulsar = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", alPulsar);
    // El fondo no debe desplazarse detras del visor.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  return createPortal(
    <div className="visor-portal">
      <EstilosImpresion />
      <div
        className="visor-overlay"
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(17,24,39,0.55)",
          display: "flex", flexDirection: "column", alignItems: "center",
          overflowY: "auto", padding: "24px 16px",
        }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="no-imprimir"
          style={{
            width: "100%", maxWidth: 860, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, marginBottom: 12, flexShrink: 0,
          }}
        >
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: T.font }}>
            {titulo}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {acciones}
            <Btn icon={Download} onClick={() => window.print()}>Descargar PDF</Btn>
            <IconBtn icon={X} title="Cerrar" onClick={onClose} />
          </div>
        </div>

        <div
          className="visor-hoja"
          style={{
            width: "100%", maxWidth: 860, background: "#fff",
            borderRadius: 10, padding: "28px 32px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.28)", marginBottom: 24, flexShrink: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
