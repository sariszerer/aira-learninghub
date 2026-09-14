// Reglas de la minuta interdisciplinaria.
//
// Aparte de la pantalla porque son decisiones sobre el contenido — qué cuenta
// como participante, cómo se lee un tipo múltiple — y porque así se pueden
// probar sin montar el modal ni el documento.

// Los participantes se escriben uno por línea y se guardan igual.
//
// Antes era una sola línea con comas, y en una reunión de escuela con cinco
// personas y sus cargos eso es una cadena ilegible que nadie vuelve a leer. Al
// separarlas se pueden contar, listar en viñetas y salir bien en el PDF.
export function participantesDe(texto = "") {
  return String(texto)
    .split(/\r?\n|;/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function participantesATexto(lista = []) {
  return lista.join("\n");
}

// El tipo es una lista: una reunión con la escuela Y la familia es lo normal.
// Se acepta el valor antiguo — una cadena suelta — porque puede venir de una
// fila guardada antes del cambio.
export function tiposDe(valor) {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (typeof valor === "string" && valor.trim()) return [valor.trim()];
  return [];
}

export function textoDeTipos(valor) {
  const t = tiposDe(valor);
  if (t.length === 0) return "Sin clasificar";
  if (t.length === 1) return t[0];
  return `${t.slice(0, -1).join(", ")} y ${t[t.length - 1]}`;
}

// Título del documento que se manda fuera.
//
// Lleva el nombre del niño porque la minuta sale del centro y quien la recibe
// — un colegio, un especialista externo — puede tener varios casos abiertos.
export function tituloDeMinuta(minuta, nino) {
  const quien = `${nino?.name || ""} ${nino?.lastName || ""}`.trim();
  return quien ? `Minuta — ${quien}` : "Minuta interdisciplinaria";
}

// Qué falta para poder guardar.
export function faltaEnMinuta({ participants, summary } = {}) {
  const falta = [];
  if (participantesDe(participants).length === 0) falta.push("los participantes");
  if (!String(summary || "").trim()) falta.push("el resumen");
  return falta;
}
