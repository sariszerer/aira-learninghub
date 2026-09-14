// Convierte en objetivos lo que alguien pega desde el plan de trabajo.
//
// Lo que se pega viene de un PDF o de un Word, y arrastra basura: viñetas,
// numeración, tabulaciones, líneas en blanco entre puntos. Si esa basura entra
// tal cual, el expediente acaba con objetivos llamados "1." o "•".

// Viñetas y numeración al principio de la línea: "1. ", "1) ", "- ", "• ",
// "a) ", "*". Se quitan solo si van AL PRINCIPIO y las sigue algo.
const PREFIJO = /^\s*(?:\d{1,2}\s*[.)-]|[a-zA-Z]\s*[.)]|[-*•·–—>])\s+/;

// Una línea que no llega a esto no es un objetivo: es un encabezado suelto,
// un número de página o el resto de una palabra cortada.
const MINIMO = 4;

export function objetivosDeTexto(texto = "") {
  const vistos = new Set();
  return String(texto)
    .split(/\r?\n/)
    .map((l) => l.replace(PREFIJO, "").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= MINIMO)
    .filter((l) => {
      // Sin repetir: al pegar de un PDF con encabezado por página, el título
      // del plan aparece tantas veces como páginas tenga.
      const clave = l.toLowerCase();
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
}
