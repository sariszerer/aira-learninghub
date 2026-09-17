// Vocabulario del dominio clinico, compartido por varias pantallas.

export const ACTIVITY_CATALOG = [
  "Rompecabezas", "Sudoku", "Jenga", "Recorte", "Escritura",
  "Actividad sensorial", "Juego de mesa", "Clasificación",
  "Comprensión lectora", "Motricidad fina", "Circuito motor",
  "Cuento interactivo",
];

export const DOC_TYPES = {
  evaluacion: { label: "Evaluación", plural: "Evaluaciones" },
  reporte: { label: "Reporte", plural: "Reportes" },
  informe: { label: "Informe", plural: "Informes" },
  anamnesis: { label: "Anamnesis", plural: "Anamnesis" },
  plan_trabajo: { label: "Plan de trabajo", plural: "Planes de trabajo" },
  pautas_crianza: { label: "Pautas de Crianza", plural: "Pautas de Crianza" },
  // Los formatos del centro que llegan llenos en papel y se escanean: fichas
  // de ingreso, autorizaciones de salida, permisos de fotografia. No tenian
  // sitio y acababan de "Informe", que es otra cosa.
  formulario: { label: "Formulario", plural: "Formularios" },
  // El consentimiento informado es un tipo propio y no un apartado de la
  // anamnesis. Colgaba de ella, asi que solo existia si la anamnesis se habia
  // llenado EN la plataforma: de 45 expedientes hay 4 con consentimiento
  // firmado, y los demas no tenian ni donde pedirlo. Como tipo propio se ve de
  // un vistazo quien lo tiene y quien no.
  consentimiento: { label: "Consentimiento informado", plural: "Consentimientos" },
};

// Documentos de gabinete externo. Van aparte de DOC_TYPES porque cuelgan de un
// colegio y no de un paciente, y las pestañas del expediente no deben
// ofrecerlos ni contarlos.
export const DOC_TYPES_GABINETE = {
  tutor_quincenal: { label: "Reporte Quincenal de Tutor", plural: "Reportes Quincenales de Tutor" },
  supervision: { label: "Registro de Supervisión y Observación", plural: "Registros de Supervisión y Observación" },
  minuta_interdisciplinaria: { label: "Minuta de Reunión Interdisciplinaria", plural: "Minutas de Reunión Interdisciplinaria" },
  contrato: { label: "Contrato firmado", plural: "Contratos firmados" },
};

export const MEETING_TYPES = ["Escuela", "Especialista externo", "Familia", "Otro"];
