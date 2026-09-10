import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { T } from "../theme.js";
import { useEsMovil } from "../lib/pantalla.js";

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
  const esMovil = useEsMovil();

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
        display: "flex", justifyContent: "center", overflowY: "auto",
        // En movil sube desde abajo y pega al borde: centrado y con margen deja
        // el formulario en una tira estrecha en medio de la pantalla.
        alignItems: esMovil ? "flex-end" : "flex-start",
        padding: esMovil ? 0 : "40px 20px",
      }}
      // mousedown y no click: si se empieza a arrastrar dentro del modal y se
      // suelta fuera, un click cerraria el modal y se perderia lo escrito.
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: esMovil ? "100%" : width,
          borderRadius: esMovil ? "20px 20px 0 0" : 20,
          maxHeight: esMovil ? "92vh" : undefined,
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
