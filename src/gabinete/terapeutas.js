// Los terapeutas contratados de un colegio, con el niño al que acompaña cada uno.
//
// El programa crece por personas: AIRA coloca una terapeuta por niño, y cuando
// el centro contrata otro caso entra otra terapeuta. Así que no hay "la
// especialista del colegio" — hay una lista que se alarga.

// Quién trabaja hoy en este centro.
//
// Se incluye a quien acompaña a un estudiante del colegio aunque su propia fila
// no lleve schoolId: al crear una tutora desde el alta de un estudiante puede
// quedar sin colegio, y dejarla fuera de la lista la volvería invisible en la
// única pantalla donde se administra.
export function terapeutasDeColegio(tutores = [], estudiantes = [], schoolId) {
  const delColegio = estudiantes.filter((e) => e.schoolId === schoolId);
  const porEstudiantes = new Set(delColegio.map((e) => e.tutorId).filter(Boolean));
  return tutores
    .filter((t) => t.activo !== false && (t.schoolId === schoolId || porEstudiantes.has(t.id)))
    .map((t) => ({ ...t, acompana: delColegio.filter((e) => e.tutorId === t.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Cómo se lee "a quién acompaña" debajo del nombre.
//
// Sin asignar NO es lo mismo que un hueco: una terapeuta contratada que no
// acompaña a nadie es una situación que alguien tiene que resolver, y la lista
// es donde se ve.
export function aQuienAcompana(acompana = []) {
  if (acompana.length === 0) return "Sin estudiante asignado";
  return acompana
    .map((e) => `${e.name} ${e.lastName || ""}`.trim())
    .join(" · ");
}
