// Qué contiene el expediente según a quién pertenece.
//
// El centro atiende dos cosas distintas con la misma maquinaria: niños, y
// madres o padres en Pautas de Crianza. Comparten plan de trabajo, sesiones y
// objetivos — por eso viven en la misma tabla — pero no comparten el resto.
//
// A una madre no se le hace anamnesis del desarrollo, ni reporte para la
// familia (la familia es ella), ni reunión interdisciplinaria sobre su caso.
// Enseñarle esas pestañas vacías no es neutro: hace dudar de si falta algo por
// llenar.

export const TIPOS = {
  nino: { label: "Niño", plural: "Niños" },
  acudiente: { label: "Madre o padre", plural: "Madres y padres" },
};

// Las pestañas que se ofrecen, en orden. Las de un acudiente son justo las
// tres que la directora pidió, más el resumen que las enmarca.
const PESTANAS_NINO = [
  "resumen", "sesiones", "objetivos", "plan",
  "anamnesis", "reportes", "interdisciplinario",
];
const PESTANAS_ACUDIENTE = ["resumen", "sesiones", "objetivos", "plan"];

export function esAcudiente(persona) {
  return persona?.tipo === "acudiente";
}

export function pestanasDe(persona) {
  return esAcudiente(persona) ? PESTANAS_ACUDIENTE : PESTANAS_NINO;
}

export function tienePestana(persona, id) {
  return pestanasDe(persona).includes(id);
}

// Campos de identidad que solo tienen sentido en un niño.
//
// La fecha de nacimiento de una madre no se usa para nada aquí — no hay hitos
// del desarrollo que fechar — y el colegio es el de su hijo, no el suyo.
export function pideDatosDeNino(persona) {
  return !esAcudiente(persona);
}

// Cómo se nombra a quien acompaña, para la ficha.
export function textoDeVinculo(persona, todos = []) {
  if (!esAcudiente(persona)) return null;
  if (!persona.acudienteDe) return "Sin hijo o hija en el centro";
  const hijo = todos.find((c) => c.id === persona.acudienteDe);
  return hijo ? `Madre o padre de ${hijo.name} ${hijo.lastName || ""}`.trim() : null;
}
