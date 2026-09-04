import React from "react";
import { T } from "../theme.js";
import { NIVELES_GAS, etiquetaGas } from "../lib/reportes.js";

// Piezas de composicion de los reportes. Todas evitan cortarse a mitad de
// pagina al imprimir (break-inside: avoid), que es la diferencia entre un PDF
// presentable y una tabla partida por la mitad.

const evitarCorte = { breakInside: "avoid", pageBreakInside: "avoid" };

// omitirEnImpresion sirve para las secciones de redaccion libre que quedaron
// sin llenar: un titulo con nada debajo, en un documento firmado que se le
// entrega a una familia, se lee como un fallo de generacion.
export function SeccionDoc({ titulo, nota, omitirEnImpresion = false, children }) {
  return (
    <section
      className={omitirEnImpresion ? "no-imprimir" : undefined}
      style={{ marginBottom: 18, ...evitarCorte }}
    >
      <h3 style={{
        margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.brand,
        textTransform: "uppercase", letterSpacing: "0.07em",
        paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
      }}>
        {titulo}
      </h3>
      {nota && <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 7 }}>{nota}</div>}
      {children}
    </section>
  );
}

// Marcador explicito para lo que el documento pide y el sistema todavia no
// captura. Es mejor que una seccion en blanco: en blanco parece un error de
// generacion, y esto dice de quien es el siguiente paso.
export function SinDato({ children }) {
  return (
    <div style={{
      fontSize: 11.5, color: T.inkFaint, fontStyle: "italic",
      padding: "7px 10px", background: T.surfaceSunk, borderRadius: 6,
    }}>
      {children}
    </div>
  );
}

export function TablaDoc({ columnas, filas, vacio = "Sin registros." }) {
  if (!filas.length) return <SinDato>{vacio}</SinDato>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} style={{
                textAlign: c.alinear || "left", padding: "6px 8px",
                background: T.brand, color: "#fff", fontWeight: 600,
                fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={f.id || i} style={{ background: i % 2 ? T.surfaceSunk : "#fff", ...evitarCorte }}>
              {columnas.map((c) => (
                <td key={c.clave} style={{
                  padding: "6px 8px", textAlign: c.alinear || "left",
                  borderBottom: `1px solid ${T.borderSoft}`, verticalAlign: "top",
                }}>
                  {c.celda ? c.celda(f) : (f[c.clave] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// "El nivel GAS actual deberia poder representarse tambien de forma visual
// simple (barra o semaforo) en la vista de pantalla, no solo en el PDF."
//
// Se dibuja la escala completa de -2 a +2 con la meta marcada, porque un numero
// suelto no dice nada: lo informativo es donde cae el actual RESPECTO a la
// linea base y a la meta, que es literalmente lo que pide el documento.
export function EscalaGas({ base, meta, actual, ancho = 168 }) {
  if (actual == null && base == null && meta == null) {
    return <span style={{ fontSize: 11, color: T.inkFaint, fontStyle: "italic" }}>Sin escala GAS</span>;
  }
  const alcanzada = actual != null && meta != null && actual >= meta;
  const color = actual == null ? T.inkFaint : alcanzada ? T.logrado : actual <= -2 ? T.apoyo : T.proceso;

  return (
    <div style={{ ...evitarCorte }}>
      <div style={{ display: "flex", gap: 2, width: ancho }}>
        {NIVELES_GAS.map((n) => {
          const esActual = n.valor === actual;
          const esMeta = n.valor === meta;
          const esBase = n.valor === base;
          return (
            <div key={n.valor} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: 9, borderRadius: 2,
                background: esActual ? color : T.border,
                outline: esMeta ? `1.5px solid ${T.brand}` : "none",
                outlineOffset: 1,
              }} />
              <div style={{
                fontSize: 8, marginTop: 2, lineHeight: 1.1,
                color: esActual ? color : T.inkFaint,
                fontWeight: esActual ? 700 : 400,
              }}>
                {esBase ? "base" : esMeta ? "meta" : n.valor > 0 ? `+${n.valor}` : n.valor}
              </div>
            </div>
          );
        })}
      </div>
      {actual != null && (
        <div style={{ fontSize: 10.5, color, fontWeight: 600, marginTop: 3 }}>
          {etiquetaGas(actual)}
        </div>
      )}
    </div>
  );
}

// Indicador de tres palabras del Reporte para Padres. Sin numeros ni escalas:
// "Puntuaciones o escalas sin traducir a un lenguaje comprensible para la
// familia" esta en la lista de lo que NO debe incluir.
const TONO_FAMILIA = {
  Logrado: { color: T.logrado, tint: T.logradoTint },
  "En progreso": { color: T.proceso, tint: T.procesoTint },
  Iniciando: { color: T.apoyo, tint: T.apoyoTint },
};

export function IndicadorFamilia({ texto }) {
  const t = TONO_FAMILIA[texto] || TONO_FAMILIA["En progreso"];
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      background: t.tint, color: t.color, fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {texto}
    </span>
  );
}

export function ListaDoc({ items, vacio }) {
  if (!items.length) return <SinDato>{vacio}</SinDato>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
      {items.map((t, i) => <li key={i} style={evitarCorte}>{t}</li>)}
    </ul>
  );
}
