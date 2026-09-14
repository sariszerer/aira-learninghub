import React, { useEffect, useRef } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { T } from "../theme.js";
import { limpiarHtml, textoAHtml } from "../lib/textoRico.js";

// Campo de texto con negrita, cursiva y subrayado.
//
// La minuta sale del centro: va al colegio y al especialista externo. Poder
// resaltar el acuerdo que importa o quién se hace cargo es la diferencia
// entre un muro de texto y un documento que alguien lee.
//
// Usa document.execCommand, que está marcado como obsoleto desde hace años y
// sigue funcionando en todos los navegadores, el móvil incluido. La
// alternativa es una librería de editor: cien kilobytes y una dependencia
// nueva para tres botones. Si algún día deja de funcionar, lo que se pierde
// es el formato — el texto se sigue escribiendo y se sigue guardando.
//
// Lo que sale de aquí se limpia antes de guardarse Y antes de pintarse. Dos
// veces a propósito: en la base hay minutas escritas antes de esta limpieza.

const BOTONES = [
  { orden: "bold", icono: Bold, titulo: "Negrita (Ctrl+B)" },
  { orden: "italic", icono: Italic, titulo: "Cursiva (Ctrl+I)" },
  { orden: "underline", icono: Underline, titulo: "Subrayado (Ctrl+U)" },
];

export default function EditorTexto({ valor, onChange, placeholder, filas = 4, id }) {
  const caja = useRef(null);

  // Solo se vuelca el valor de fuera cuando de verdad difiere de lo que hay
  // escrito. Reescribir el innerHTML en cada tecla manda el cursor al
  // principio del campo, que es el defecto clásico de estos editores.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const deseado = textoAHtml(valor);
    if (nodo.innerHTML !== deseado) nodo.innerHTML = deseado;
  }, [valor]);

  const aplicar = (orden) => {
    caja.current?.focus();
    document.execCommand(orden, false, null);
    onChange(limpiarHtml(caja.current?.innerHTML || ""));
  };

  const alTeclear = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const orden = { b: "bold", i: "italic", u: "underline" }[e.key.toLowerCase()];
    if (!orden) return;
    e.preventDefault();
    aplicar(orden);
  };

  const vacio = !String(valor || "").replace(/<[^>]*>/g, "").trim();

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 10, background: "#fff", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", gap: 2, padding: "5px 6px",
        borderBottom: `1px solid ${T.borderSoft}`, background: T.surfaceSunk,
      }}>
        {BOTONES.map(({ orden, icono: Icono, titulo }) => (
          <button
            key={orden}
            type="button"
            title={titulo}
            // onMouseDown y no onClick: al hacer clic en el botón el campo
            // pierde el foco y con él la selección, y el formato se aplicaría
            // sobre nada. preventDefault la conserva.
            onMouseDown={(e) => { e.preventDefault(); aplicar(orden); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 26, borderRadius: 6, cursor: "pointer",
              border: "none", background: "transparent", color: T.inkSoft,
            }}
          >
            <Icono size={14} />
          </button>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        {vacio && placeholder && (
          <div style={{
            position: "absolute", top: 9, left: 11, right: 11, pointerEvents: "none",
            color: T.inkFaint, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
          }}>
            {placeholder}
          </div>
        )}
        <div
          id={id}
          ref={caja}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={() => onChange(limpiarHtml(caja.current?.innerHTML || ""))}
          onBlur={() => onChange(limpiarHtml(caja.current?.innerHTML || ""))}
          onKeyDown={alTeclear}
          // Pegar desde Word o desde un PDF arrastra fuentes, colores y
          // tamaños que descuadran el documento. Se queda el texto y el
          // formato que se ponga aquí.
          onPaste={(e) => {
            e.preventDefault();
            const texto = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, texto);
          }}
          style={{
            minHeight: filas * 23, padding: "9px 11px", outline: "none",
            fontFamily: T.font, fontSize: 14, lineHeight: 1.6, color: T.ink,
            overflowY: "auto", maxHeight: 320, wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
}
