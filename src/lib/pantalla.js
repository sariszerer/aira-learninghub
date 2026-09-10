import { useEffect, useState } from "react";

// Ancho por debajo del cual se considera móvil.
//
// 720 y no 640: la barra lateral se lleva 60px de riel, y en una tableta en
// vertical (768) la tabla de pacientes ya no cabe con sus seis columnas.
export const MOVIL = 720;

// ¿Estamos en una pantalla estrecha?
//
// En JavaScript y no en CSS a propósito. Esta aplicación se escribe con estilos
// en línea, y una hoja aparte solo puede alcanzarlos a través de clases puestas
// a mano en cada componente. Eso ya se intentó: de los siete ganchos `.aira-*`
// que había, SEIS apuntaban a clases que los refactores borraron, y nadie se
// enteró porque una regla CSS que no encuentra su selector no se queja. La
// aplicación llevaba meses sin ser responsiva de verdad.
//
// Con un hook, la variante móvil vive dentro del mismo objeto de estilos que la
// de escritorio: quien reescriba el componente la tiene delante.
export function useEsMovil(limite = MOVIL) {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= limite
  );

  useEffect(() => {
    const consulta = window.matchMedia(`(max-width: ${limite}px)`);
    const alCambiar = (e) => setEsMovil(e.matches);
    setEsMovil(consulta.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, [limite]);

  return esMovil;
}
