import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { T } from "../theme.js";

// Se monta con portal directo a <body>.
//
// Antes se renderizaba donde estuviera el componente que lo abria, y su
// z-index quedaba encerrado en el contexto de apilamiento de algun ancestro:
// el modal de editar perfil salia POR DEBAJO de la barra lateral, con la
// mitad izquierda tapada. Perseguir que ancestro lo causaba arregla un caso;
// el portal los arregla todos, porque saca el modal del arbol.
//
// El z-index queda por encima de la barra (20) y por debajo del visor de
// reportes (1000), que si debe poder abrirse sobre un modal.
//
// Y por eso mismo el modal fija AQUI la tipografia. Salir del arbol tambien
// significa salir del div raiz de App, que es donde vive fontFamily: al colgar
// de <body> directamente, todo texto que no declarara su fuente caia en la del
// navegador. Se notaba en cada modal, no solo en los nuevos: las etiquetas de
// los campos salian en otra letra que el resto de la aplicacion. Se venia
// tapando poniendo fontFamily elemento por elemento, que es la razon de que
// unos si y otros no.
export default function Modal({ children, onClose, width = 560 }) {
  useEffect(() => {
    const alPulsar = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", alPulsar);
    // El fondo no debe desplazarse detras del modal.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(21,47,54,0.45)", zIndex: 100,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 20px", overflowY: "auto",
      }}
      // mousedown y no click: si se empieza a arrastrar dentro del modal y se
      // suelta fuera, un click cerraria el modal y se perderia lo escrito.
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
          boxShadow: "0 20px 60px rgba(21,47,54,0.25)", overflow: "hidden",
          fontFamily: T.font, color: T.ink,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
