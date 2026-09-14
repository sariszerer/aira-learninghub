import React from "react";
import { AlertTriangle, Copy, X } from "lucide-react";
import { T } from "../theme.js";

// Cuando algo revienta al pintarse, se dice qué fue.
//
// React desmonta el árbol entero ante un error de render, y lo que queda es una
// pantalla blanca. Desde fuera es indistinguible de "no pasó nada": ha costado
// dos rondas de ida y vuelta averiguar que el reporte para la familia lanzaba
// un ReferenceError, porque el único síntoma visible era el vacío.
//
// Esto no arregla el fallo — lo enseña. Y enseña lo único que sirve para
// arreglarlo: el mensaje y dónde ocurrió, con un botón para copiarlo.
export default class LimiteDeError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, pila: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // También a la consola: quien sepa mirarla tiene ahí la traza completa.
    console.error(`Error en ${this.props.donde || "la aplicación"}:`, error, info);
    this.setState({ pila: info?.componentStack || null });
  }

  render() {
    const { error, pila } = this.state;
    if (!error) return this.props.children;

    const texto = [
      `Error en ${this.props.donde || "la aplicación"}`,
      error.message || String(error),
      pila ? `\n${pila.trim()}` : "",
    ].join("\n");

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1100, overflowY: "auto",
        background: "rgba(21,47,54,0.55)", padding: 24,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        fontFamily: T.font,
      }}>
        <div style={{
          background: "#fff", borderRadius: 18, maxWidth: 620, width: "100%",
          padding: "26px 28px", boxShadow: "0 20px 60px rgba(21,47,54,0.3)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <AlertTriangle size={22} color={T.apoyo} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>
                Esto no se pudo mostrar
              </div>
              <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.6 }}>
                Falló al dibujar {this.props.donde || "la pantalla"}. No se ha perdido
                nada de lo guardado. Copia el detalle y pásalo para que se arregle.
              </div>
            </div>
            {this.props.onCerrar && (
              <button onClick={this.props.onCerrar} aria-label="Cerrar"
                style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 2, lineHeight: 0 }}>
                <X size={18} />
              </button>
            )}
          </div>

          <pre style={{
            margin: 0, padding: "12px 14px", borderRadius: 10, maxHeight: 260,
            overflow: "auto", background: T.surfaceSunk, border: `1px solid ${T.border}`,
            fontSize: 12, lineHeight: 1.55, color: T.ink, whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {texto}
          </pre>

          <div style={{ display: "flex", gap: 9, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => navigator.clipboard?.writeText(texto)}
              style={{
                display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                padding: "8px 14px", borderRadius: 9, border: `1px solid ${T.brand}`,
                background: T.brandTint, color: T.brand, fontFamily: T.font,
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Copy size={14} /> Copiar el detalle
            </button>
            {this.props.onCerrar && (
              <button
                onClick={this.props.onCerrar}
                style={{
                  padding: "8px 14px", borderRadius: 9, cursor: "pointer",
                  border: `1px solid ${T.border}`, background: T.surface,
                  color: T.ink, fontFamily: T.font, fontSize: 13, fontWeight: 600,
                }}
              >
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
