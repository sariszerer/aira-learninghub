// Estructura de los formatos de Tutor AIRA, transcrita de los documentos
// "Tutor Aira_Registro Supervicion.docx" y "Tutor Aira_Reporte Quincenal.docx".
//
// Vive en datos y no en JSX por dos razones: el mismo formato se pinta en el
// formulario de captura y en el documento que se descarga, y una lista de
// secciones repetida en dos sitios diverge a la primera correccion. Ademas el
// contenido se guarda en documents.fields con estas mismas claves, asi que
// renombrar un campo aqui obliga a mirar que pasa con lo ya guardado.

// Nivel de apoyo de la tutora, seccion 3 del registro de supervision. Va de
// menos a mas ayuda: el orden es informacion, no una lista alfabetica.
export const NIVELES_APOYO = [
  "Independiente",
  "Señal o recordatorio breve",
  "Instrucción verbal",
  "Modelado",
  "Apoyo frecuente",
  "Intervención directa",
];

// Escala del reporte quincenal, seccion 1.
export const ESCALA_QUINCENAL = [
  { valor: 1, corto: "1", label: "Requiere apoyo constante" },
  { valor: 2, corto: "2", label: "Apoyo frecuente" },
  { valor: 3, corto: "3", label: "Apoyo ocasional" },
  { valor: 4, corto: "4", label: "Mayormente independiente" },
];

export const AREAS_QUINCENAL = [
  { clave: "atencion_explicaciones", label: "Atención durante explicaciones" },
  { clave: "seguimiento_instrucciones", label: "Seguimiento de instrucciones" },
  { clave: "concentracion", label: "Concentración / permanencia en tarea" },
  { clave: "inicio_tareas", label: "Inicio de tareas" },
  { clave: "finalizacion_tareas", label: "Finalización de tareas" },
  { clave: "lectoescritura", label: "Lectoescritura" },
  { clave: "organizacion", label: "Organización de materiales" },
  { clave: "solicitud_ayuda", label: "Solicitud adecuada de ayuda" },
  { clave: "frustracion", label: "Manejo de frustración" },
  { clave: "independencia", label: "Independencia" },
];

// ── Registro de Supervisión y Observación Escolar ────────────────────────────

export const FORMATO_SUPERVISION = {
  titulo: "Registro de Supervisión y Observación Escolar",
  // Este formato lo escribe SOLO dirección. Es la valoración que se hace sobre
  // la tutora — observa su intervención y califica su nivel de apoyo — y la
  // persona evaluada no puede editar su propia evaluación. Leerla sí: es su
  // devolución, y para eso está la lista de documentos.
  permisoEscritura: "gabinete:supervision:write",
  // La cabecera del formato: datos de la observación concreta.
  cabecera: [
    { clave: "hora", label: "Hora", tipo: "time" },
    { clave: "duracion", label: "Duración", tipo: "texto", placeholder: "Ej: 45 min" },
    { clave: "asignatura", label: "Asignatura / actividad observada", tipo: "texto", ancho: 2 },
  ],
  secciones: [
    {
      titulo: "1. Contexto de la observación",
      campos: [
        { clave: "actividad_grupo", label: "Actividad que realizaba el grupo", tipo: "area" },
        { clave: "demanda", label: "Demanda presentada al estudiante", tipo: "area" },
      ],
    },
    {
      titulo: "2. Observación del estudiante",
      nota: "Registrar conductas observables, evitando interpretaciones.",
      campos: [
        { clave: "atencion", label: "Atención y concentración", tipo: "area" },
        { clave: "instrucciones", label: "Seguimiento de instrucciones", tipo: "area" },
        { clave: "participacion", label: "Participación académica", tipo: "area" },
        { clave: "solicitud_ayuda", label: "Solicitud de ayuda", tipo: "area" },
        { clave: "ante_dificultad", label: "Respuesta ante dificultad o frustración", tipo: "area" },
        { clave: "interaccion", label: "Interacción con docentes y compañeros", tipo: "area" },
      ],
    },
    {
      titulo: "3. Nivel de apoyo proporcionado por la tutora",
      campos: [
        { clave: "nivel_apoyo", label: "Nivel de apoyo", tipo: "opciones", opciones: NIVELES_APOYO },
        { clave: "ejemplo_apoyo", label: "Ejemplo observado", tipo: "area" },
      ],
    },
    {
      titulo: "4. Observación de la intervención de la tutora",
      campos: [
        { clave: "fortalezas", label: "Fortalezas observadas", tipo: "area" },
        { clave: "ajustes", label: "Oportunidades de ajuste", tipo: "area" },
        { clave: "favorecio_autonomia", label: "¿La intervención favoreció autonomía?", tipo: "area" },
      ],
    },
    {
      titulo: "5. Secuencia relevante observada",
      campos: [
        { clave: "antecedente", label: "Antecedente / situación", tipo: "area" },
        { clave: "respuesta_estudiante", label: "Respuesta del estudiante", tipo: "area" },
        { clave: "intervencion_tutora", label: "Intervención de la tutora", tipo: "area" },
        { clave: "resultado", label: "Resultado", tipo: "area" },
      ],
    },
    {
      titulo: "6. Recomendaciones de supervisión",
      campos: [
        { clave: "mantener", label: "Mantener", tipo: "area" },
        { clave: "modificar", label: "Modificar", tipo: "area" },
        { clave: "introducir", label: "Introducir", tipo: "area" },
        { clave: "reducir", label: "Reducir gradualmente", tipo: "area" },
      ],
    },
    {
      titulo: "7. Objetivo prioritario hasta próxima supervisión",
      campos: [{ clave: "objetivo_prioritario", label: null, tipo: "area" }],
    },
    {
      titulo: "8. Seguimiento requerido",
      campos: [{ clave: "seguimiento", label: null, tipo: "area" }],
    },
  ],
};

// ── Reporte Quincenal de Acompañamiento ──────────────────────────────────────

export const FORMATO_QUINCENAL = {
  titulo: "Reporte Quincenal de Acompañamiento",
  cabecera: [
    { clave: "periodo_desde", label: "Periodo desde", tipo: "fecha" },
    { clave: "periodo_hasta", label: "Periodo hasta", tipo: "fecha" },
    { clave: "dias_acompanamiento", label: "Días de acompañamiento", tipo: "numero" },
  ],
  secciones: [
    {
      titulo: "1. Indicadores principales",
      nota: "Calificar según lo observado durante este periodo.",
      // La rejilla se pinta aparte: es una tabla de 10 filas por 4 columnas y
      // como lista de campos sueltos seria ilegible.
      rejilla: { clave: "indicadores", areas: AREAS_QUINCENAL, escala: ESCALA_QUINCENAL },
      campos: [],
    },
    {
      titulo: "2. ¿Qué logró con mayor independencia este periodo?",
      campos: [{ clave: "logros_independencia", label: null, tipo: "area" }],
    },
    {
      titulo: "3. ¿En qué situaciones necesitó mayor apoyo?",
      campos: [{ clave: "mayor_apoyo", label: null, tipo: "area" }],
    },
    {
      titulo: "4. Estrategias utilizadas",
      campos: [
        { clave: "estrategias_funcionaron", label: "¿Qué estrategias funcionaron mejor?", tipo: "area" },
        { clave: "estrategias_no_funcionaron", label: "¿Qué estrategias no tuvieron el efecto esperado?", tipo: "area" },
      ],
    },
    {
      titulo: "5. Conducta y regulación",
      campos: [
        { clave: "detonantes", label: "Detonantes observados", tipo: "area" },
        { clave: "respuesta_estudiante", label: "Respuesta del estudiante", tipo: "area" },
        { clave: "intervencion", label: "Intervención realizada", tipo: "area" },
        { clave: "resultado", label: "Resultado", tipo: "area" },
      ],
    },
    {
      titulo: "6. Situaciones relevantes del periodo",
      nota: "Registrar únicamente hechos observables y relevantes para el seguimiento.",
      campos: [{ clave: "situaciones", label: null, tipo: "area" }],
    },
    {
      titulo: "7. Prioridad para las próximas dos semanas",
      campos: [{ clave: "prioridad", label: null, tipo: "area" }],
    },
    {
      titulo: "8. Observaciones de docentes",
      campos: [{ clave: "observaciones_docentes", label: null, tipo: "area" }],
    },
  ],
};

// ── Plan de trabajo ──────────────────────────────────────────────────────────
//
// No hay documento de referencia todavia, asi que se deja el formato minimo que
// el propio programa exige: objetivos, estrategias y como se mide. Cuando
// llegue el formato oficial se sustituye aqui y las dos pantallas lo recogen.
export const FORMATO_PLAN_TUTOR = {
  titulo: "Plan de Trabajo",
  cabecera: [
    { clave: "vigencia_desde", label: "Vigente desde", tipo: "fecha" },
    { clave: "vigencia_hasta", label: "Vigente hasta", tipo: "fecha" },
  ],
  secciones: [
    {
      titulo: "Objetivos del acompañamiento",
      campos: [{ clave: "objetivos", label: null, tipo: "area", filas: 4 }],
    },
    {
      titulo: "Estrategias y apoyos",
      campos: [{ clave: "estrategias", label: null, tipo: "area", filas: 4 }],
    },
    {
      titulo: "Criterios de avance",
      nota: "Cómo se sabrá que el objetivo se está alcanzando.",
      campos: [{ clave: "criterios", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Acuerdos con la familia y el colegio",
      campos: [{ clave: "acuerdos", label: null, tipo: "area", filas: 3 }],
    },
  ],
};

// ── Programa de preescolar ───────────────────────────────────────────────────
//
// Tampoco hay documentos de referencia todavia. Estos formatos recogen lo que
// el propio programa exige segun como lo describio la clinica: el plan
// distingue si la atencion se da en la escuela o en el centro, porque de eso
// depende la ruta del caso.

export const FORMATO_PLAN_PREESCOLAR = {
  titulo: "Plan de Trabajo",
  cabecera: [
    { clave: "vigencia_desde", label: "Vigente desde", tipo: "fecha" },
    { clave: "vigencia_hasta", label: "Vigente hasta", tipo: "fecha" },
  ],
  secciones: [
    {
      titulo: "Atención en la escuela",
      nota: "Qué se trabaja dentro del aula y con quién.",
      campos: [
        { clave: "objetivos_escuela", label: "Objetivos", tipo: "area", filas: 3 },
        { clave: "apoyos_aula", label: "Apoyos y ajustes en el aula", tipo: "area", filas: 3 },
        { clave: "responsable_escuela", label: "Responsable en el colegio", tipo: "area", filas: 1 },
      ],
    },
    {
      titulo: "Atención en el centro",
      nota: "Solo si el caso se deriva a AIRA. Qué se pide y con qué frecuencia.",
      campos: [
        { clave: "motivo_derivacion", label: "Motivo de la derivación", tipo: "area", filas: 2 },
        { clave: "disciplinas", label: "Disciplinas sugeridas", tipo: "area", filas: 1 },
        { clave: "frecuencia", label: "Frecuencia propuesta", tipo: "area", filas: 1 },
      ],
    },
    {
      titulo: "Acuerdos con la familia",
      campos: [{ clave: "acuerdos_familia", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Cómo se revisa el avance",
      campos: [{ clave: "revision", label: null, tipo: "area", filas: 2 }],
    },
  ],
};

export const FORMATO_SEGUIMIENTO_CASO = {
  titulo: "Seguimiento de caso",
  cabecera: [],
  secciones: [
    {
      titulo: "Qué se observó",
      nota: "Hechos observables del periodo, no interpretaciones.",
      campos: [{ clave: "observado", label: null, tipo: "area", filas: 4 }],
    },
    {
      titulo: "Qué se hizo",
      campos: [{ clave: "intervencion", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Cambios respecto al seguimiento anterior",
      campos: [{ clave: "cambios", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Siguiente paso",
      campos: [{ clave: "siguiente", label: null, tipo: "area", filas: 2 }],
    },
  ],
};

export const FORMATO_INFORME_FAMILIA = {
  titulo: "Informe para la familia",
  cabecera: [],
  secciones: [
    {
      titulo: "Qué observamos",
      nota: "En lenguaje claro, sin terminología técnica sin explicar.",
      campos: [{ clave: "observamos", label: null, tipo: "area", filas: 4 }],
    },
    {
      titulo: "Qué estamos haciendo en la escuela",
      campos: [{ clave: "en_escuela", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Qué recomendamos",
      campos: [{ clave: "recomendamos", label: null, tipo: "area", filas: 3 }],
    },
    {
      titulo: "Cómo pueden acompañar en casa",
      campos: [{ clave: "en_casa", label: null, tipo: "area", filas: 3 }],
    },
  ],
};

export const FORMATOS_TUTOR = {
  plan_trabajo_tutor: FORMATO_PLAN_TUTOR,
  supervision: FORMATO_SUPERVISION,
  tutor_quincenal: FORMATO_QUINCENAL,
  plan_preescolar: FORMATO_PLAN_PREESCOLAR,
  seguimiento_caso: FORMATO_SEGUIMIENTO_CASO,
  informe_familia: FORMATO_INFORME_FAMILIA,
};

// Vacio inicial de un formato: las claves existen desde el principio para que
// el formulario sea controlado y React no avise de un input que pasa de no
// controlado a controlado al escribir la primera letra.
export function vacioDeFormato(formato) {
  const v = {};
  for (const c of formato.cabecera || []) v[c.clave] = "";
  for (const s of formato.secciones) {
    for (const c of s.campos) v[c.clave] = "";
    if (s.rejilla) v[s.rejilla.clave] = {};
  }
  return v;
}
