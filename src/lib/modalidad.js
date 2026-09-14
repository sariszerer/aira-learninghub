// Cómo se dio la sesión: sola, acompañada o en suplencia.
//
// Se separó de la especialidad porque son dos preguntas distintas y estaban
// respondidas por el mismo campo. "Kids Club" contestaba a la vez "qué terapia
// fue" y "quién la dio", así que cuando María Virginia acompañaba a la
// terapeuta de Terapia Ocupacional la sesión se archivaba como Kids Club — y
// de ahí esa área acababa en el expediente del niño, que no la recibe.

export const SOLA = "";

// Las que ya usa el centro. La lista está abierta a propósito: `modalidad` es
// texto libre en la base, y nombrar una figura nueva no debería exigir tocar
// el código ni migrar la tabla.
export const MODALIDADES = ["Acompañamiento", "Suplencia", "Co-terapia", "Observación"];

export function esAcompanada(modalidad) {
  return !!String(modalidad || "").trim();
}

// Cómo se lee en la ficha y en el reporte.
//
// La preposición cambia con la figura y no es un detalle: "suplencia a Celilia"
// se entiende al revés que "suplencia de Celilia" — quien suple y quien es
// suplida se invierten.
export function textoDeModalidad(modalidad, nombreDelOtro) {
  const m = String(modalidad || "").trim();
  if (!m) return null;
  const quien = String(nombreDelOtro || "").trim();
  if (!quien) return m;
  const enLugarDe = /^(suplencia|sustituci[óo]n)$/i.test(m);
  return `${m} ${enLugarDe ? "de" : "con"} ${quien}`;
}

// Qué falta para poder guardar.
//
// Una suplencia sin decir a quién se suple no sirve para nada: el dato por el
// que se mira una suplencia es justamente de quién era la sesión.
export function faltaEnModalidad({ modalidad, conEspecialista } = {}) {
  if (!esAcompanada(modalidad)) return [];
  return conEspecialista ? [] : ["con qué especialista"];
}
