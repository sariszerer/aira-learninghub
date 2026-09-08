// Vocabulario del programa de preescolar: detección, prevención y atención.
//
// Vive en datos porque lo usan tres pantallas — la lista por nivel, el modal de
// tamizaje y el expediente del estudiante — y una lista de estados repetida en
// tres sitios se desincroniza a la primera que se añada.

export const NIVELES = ["PK1", "PK2", "PK3", "PK4", "PK5"];

// Los tres desenlaces de un tamizaje. 'pendiente' existe para poder registrar
// que la prueba se aplicó antes de tener la lectura: sin él, o se inventa un
// resultado o no se puede guardar la aplicación.
export const RESULTADOS = {
  pendiente:     { label: "Pendiente de lectura", tono: "neutro" },
  sin_hallazgos: { label: "Sin hallazgos",        tono: "bien" },
  seguimiento:   { label: "Requiere seguimiento", tono: "aviso" },
  derivar:       { label: "Derivar",              tono: "alerta" },
};

// La ruta es el ESTADO del caso, no un documento: dice qué se decidió hacer con
// el niño después del tamizaje.
export const RUTAS = {
  sin_evaluar:  { label: "Sin evaluar",             tono: "neutro", orden: 0 },
  observacion:  { label: "En observación",          tono: "aviso",  orden: 1 },
  escuela:      { label: "Atención en la escuela",  tono: "bien",   orden: 2 },
  centro:       { label: "Derivado al centro",      tono: "alerta", orden: 3 },
  ambas:        { label: "Escuela y centro",        tono: "alerta", orden: 4 },
  alta:         { label: "De alta",                 tono: "neutro", orden: 5 },
};

// Un caso derivado al centro que no tiene expediente clínico está a medio
// cerrar: alguien decidió que necesita atención y nadie la abrió. El sistema
// lo señala en vez de dejarlo pasar.
export function faltaExpediente(estudiante) {
  return ["centro", "ambas"].includes(estudiante.ruta) && !estudiante.childId;
}

// El tema entra por parametro y no por import para que este modulo siga siendo
// datos puros. El parametro NO se llama T: ese nombre es el del tema importado
// en todo el resto del codigo, y reutilizarlo aqui haria dudar de si es el
// mismo objeto.
export function tonoDe(tono, tema) {
  return {
    bien:   { color: tema.logrado, fondo: tema.logradoTint },
    aviso:  { color: tema.proceso, fondo: tema.procesoTint },
    alerta: { color: tema.apoyo,   fondo: tema.apoyoTint },
    neutro: { color: tema.inkSoft, fondo: tema.surfaceSunk },
  }[tono] || { color: tema.inkSoft, fondo: tema.surfaceSunk };
}

// Resumen de un nivel: lo que la coordinación necesita ver de un vistazo.
export function resumenDeNivel(estudiantes) {
  const porRuta = {};
  for (const e of estudiantes) porRuta[e.ruta] = (porRuta[e.ruta] || 0) + 1;
  return {
    total: estudiantes.length,
    porRuta,
    sinEvaluar: porRuta.sin_evaluar || 0,
    derivados: (porRuta.centro || 0) + (porRuta.ambas || 0),
    pendientesDeExpediente: estudiantes.filter(faltaExpediente).length,
  };
}
