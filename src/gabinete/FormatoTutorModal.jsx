import React, { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { T, TODAY, inputStyle } from "../theme.js";
import { Btn, Modal, ModalHeader } from "../ui/index.js";
import { FORMATOS_TUTOR, vacioDeFormato } from "./formatosTutor.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";

// Captura de un documento del expediente del estudiante.
//
// Dos modos, como pidio la clinica: llenar el formato campo a campo, o subir el
// PDF ya firmado. No son excluyentes en la practica — a veces se llena aqui y
// se adjunta el escaneado — pero se eligen por separado para que la pantalla no
// pida las dos cosas a la vez.
//
// El formato lo dicta formatosTutor.js. Este componente no sabe que campos
// tiene un registro de supervision: los recorre. Asi, cuando llegue el formato
// oficial del plan de trabajo, se cambia el dato y esta pantalla lo recoge.

const PESO_MAXIMO = 4 * 1024 * 1024;

export default function FormatoTutorModal({ tipo, estudiante, tutor, onGuardar, onClose }) {
  const formato = FORMATOS_TUTOR[tipo];
  const [modo, setModo] = useState("formato"); // "formato" | "pdf"
  const [fecha, setFecha] = useState(TODAY);
  const [datos, setDatos] = useState(() => vacioDeFormato(formato));
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState(null);
  const archivo = useRef();

  const set = (k, v) => setDatos((d) => ({ ...d, [k]: v }));

  const ponerNota = (area, valor) =>
    setDatos((d) => ({ ...d, indicadores: { ...(d.indicadores || {}), [area]: valor } }));

  const tomarPdf = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    if (f.type !== "application/pdf") { setError("El archivo tiene que ser un PDF."); avisar.error("No se pudo adjuntar el PDF", "El archivo tiene que ser un PDF."); return; }
    // El PDF se guarda dentro de la fila como data URI: no hay almacenamiento
    // de archivos todavia. El limite evita que una fila crezca hasta romper la
    // carga del expediente entero.
    if (f.size > PESO_MAXIMO) { setError("El PDF pesa más de 4 MB. Comprímelo o súbelo por partes."); avisar.error("No se pudo adjuntar el PDF", "Pesa más de 4 MB. Comprímelo o súbelo por partes."); return; }
    const lector = new FileReader();
    lector.onload = () => setPdf({ nombre: f.name, datos: lector.result });
    lector.readAsDataURL(f);
  };

  const guardar = () => {
    // En modo PDF el archivo es el documento entero: sin el no hay nada que
    // guardar. En modo formato basta con la fecha, que siempre viene puesta.
    const falta = queFalta([[modo !== "pdf" || !!pdf, "el PDF del formato"]]);
    if (falta) { avisar.error(falta); return; }
    const titulo = `${formato.titulo} — ${fecha}`;
    onGuardar({
      type: tipo,
      title: titulo,
      date: fecha,
      notes: "",
      fields: modo === "pdf"
        ? { modo: "pdf", pdfNombre: pdf?.nombre, pdfDatos: pdf?.datos }
        : { modo: "formato", ...datos },
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={720}>
      <ModalHeader
        title={formato.titulo}
        subtitle={`${estudiante.name} ${estudiante.lastName || ""}${tutor ? ` · Tutora: ${tutor.name}` : ""}`}
        onClose={onClose}
      />

      <div style={{ padding: "18px 24px 0", display: "flex", gap: 8 }}>
        {[["formato", "Llenar el formato", FileText], ["pdf", "Subir PDF", Upload]].map(([m, txt, Icono]) => (
          <button
            key={m} type="button" onClick={() => setModo(m)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
              borderRadius: 8, cursor: "pointer", fontFamily: T.font, fontSize: 13,
              fontWeight: modo === m ? 700 : 400,
              border: `1.5px solid ${modo === m ? T.brand : T.border}`,
              background: modo === m ? T.brandTint : T.surface,
              color: modo === m ? T.brand : T.inkSoft,
            }}
          >
            <Icono size={14} /> {txt}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxHeight: "62vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <Campo etiqueta="Fecha">
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            style={{ ...inputStyle, boxSizing: "border-box" }}
          />
        </Campo>

        {modo === "pdf" ? (
          <div>
            <input ref={archivo} type="file" accept="application/pdf" onChange={tomarPdf} style={{ display: "none" }} />
            <button
              type="button" onClick={() => archivo.current?.click()}
              style={{
                width: "100%", padding: "26px 18px", borderRadius: 10, cursor: "pointer",
                border: `1.5px dashed ${pdf ? T.brand : T.border}`,
                background: pdf ? T.brandTint : T.surfaceSunk,
                fontFamily: T.font, fontSize: 13.5, color: pdf ? T.brand : T.inkSoft,
              }}
            >
              {pdf ? `${pdf.nombre} — pulsa para cambiarlo` : "Elegir el PDF del formato firmado"}
            </button>
            {error && <div style={{ marginTop: 10, fontSize: 12.5, color: T.apoyo }}>{error}</div>}
          </div>
        ) : (
          <>
            {formato.cabecera?.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {formato.cabecera.map((c) => (
                  <div key={c.clave} style={c.ancho === 2 ? { gridColumn: "1 / -1" } : undefined}>
                    <Campo etiqueta={c.label}>
                      <input
                        type={c.tipo === "fecha" ? "date" : c.tipo === "time" ? "time" : c.tipo === "numero" ? "number" : "text"}
                        value={datos[c.clave] || ""} placeholder={c.placeholder}
                        onChange={(e) => set(c.clave, e.target.value)}
                        style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                      />
                    </Campo>
                  </div>
                ))}
              </div>
            )}

            {formato.secciones.map((s) => (
              <section key={s.titulo}>
                <div style={{
                  fontSize: 12.5, fontWeight: 700, color: T.brand, marginBottom: 4,
                  paddingBottom: 5, borderBottom: `1px solid ${T.border}`,
                }}>
                  {s.titulo}
                </div>
                {s.nota && <div style={{ fontSize: 11.5, color: T.inkFaint, margin: "6px 0 8px" }}>{s.nota}</div>}

                {s.rejilla && (
                  <Rejilla
                    rejilla={s.rejilla}
                    valores={datos[s.rejilla.clave] || {}}
                    onCambio={ponerNota}
                  />
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
                  {s.campos.map((c) =>
                    c.tipo === "opciones" ? (
                      <Campo key={c.clave} etiqueta={c.label}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {c.opciones.map((o) => {
                            const sel = datos[c.clave] === o;
                            return (
                              <button
                                key={o} type="button" onClick={() => set(c.clave, sel ? "" : o)}
                                style={{
                                  padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                                  fontFamily: T.font, fontSize: 12, fontWeight: sel ? 700 : 400,
                                  border: `1.5px solid ${sel ? T.brand : T.border}`,
                                  background: sel ? T.brandTint : T.surface,
                                  color: sel ? T.brand : T.inkSoft,
                                }}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      </Campo>
                    ) : (
                      <Campo key={c.clave} etiqueta={c.label}>
                        <textarea
                          value={datos[c.clave] || ""} rows={c.filas || 2}
                          onChange={(e) => set(c.clave, e.target.value)}
                          style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
                        />
                      </Campo>
                    )
                  )}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>Guardar</Btn>
      </div>
    </Modal>
  );
}

// Tabla de indicadores del reporte quincenal. Se dibuja como rejilla y no como
// diez desplegables porque lo util es ver el perfil entero de un vistazo: donde
// hay 1 y donde hay 4.
function Rejilla({ rejilla, valores, onCambio }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 420 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 8px", color: T.inkFaint, fontSize: 11, fontWeight: 700 }}>Área</th>
            {rejilla.escala.map((e) => (
              <th key={e.valor} title={e.label}
                  style={{ padding: "6px 4px", width: 46, color: T.inkFaint, fontSize: 11, fontWeight: 700 }}>
                {e.corto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rejilla.areas.map((a, i) => (
            <tr key={a.clave} style={{ background: i % 2 ? T.surfaceSunk : "transparent" }}>
              <td style={{ padding: "6px 8px" }}>{a.label}</td>
              {rejilla.escala.map((e) => {
                const sel = valores[a.clave] === e.valor;
                return (
                  <td key={e.valor} style={{ textAlign: "center", padding: "4px 2px" }}>
                    <button
                      type="button" title={e.label}
                      onClick={() => onCambio(a.clave, sel ? null : e.valor)}
                      style={{
                        width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
                        border: `1.5px solid ${sel ? T.brand : T.border}`,
                        background: sel ? T.brand : T.surface,
                        color: sel ? "#fff" : "transparent",
                        fontFamily: T.font, fontSize: 11, fontWeight: 700, lineHeight: 1,
                      }}
                    >
                      {e.corto}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 6 }}>
        {rejilla.escala.map((e) => `${e.corto} = ${e.label.toLowerCase()}`).join(" · ")}
      </div>
    </div>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <div>
      {etiqueta && (
        <div style={{
          fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5,
        }}>
          {etiqueta}
        </div>
      )}
      {children}
    </div>
  );
}
