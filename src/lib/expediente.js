// Qué contiene el expediente según a quién pertenece.
//
// El centro atiende dos cosas distintas con la misma maquinaria: niños, y
// madres o padres en Pautas de Crianza. Comparten plan de trabajo, sesiones y
// objetivos — por eso viven en la misma tabla — pero no comparten el resto.
//
// A una madre no se le hace reporte para la familia (la familia es ella) ni
// reunión interdisciplinaria sobre su caso. Enseñarle esas pestañas vacías no
// es neutro: hace dudar de si falta algo por llenar.
//
// La anamnesis sí la lleva, pero no la del desarrollo: preguntarle por el
// embarazo, los hitos o el rendimiento académico es preguntarle por su hijo en
// el expediente que es de ella. Los campos que sí aplican están en
// ANAMNESIS_ACUDIENTE.

export const TIPOS = {
  nino: { label: "Niño", plural: "Niños" },
  acudiente: { label: "Madre o padre", plural: "Madres y padres" },
};

// Las pestañas que se ofrecen, en orden.
//
// El acudiente sí lleva anamnesis, pero no la del desarrollo: la suya son los
// campos de ANAMNESIS_ACUDIENTE, de abajo. Sigue sin reportes para la familia
// (la familia es ella) ni reunión interdisciplinaria sobre su caso.
const PESTANAS_NINO = [
  "resumen", "sesiones", "objetivos", "plan",
  "anamnesis", "reportes", "interdisciplinario",
];
const PESTANAS_ACUDIENTE = ["resumen", "sesiones", "objetivos", "plan", "anamnesis"];

// La anamnesis de Pautas de Crianza, por secciones y filas. Una fila con dos
// campos se dibuja en dos columnas.
//
// Los `name` son los MISMOS que usa la anamnesis del niño a propósito, aunque
// la etiqueta cambie: así el documento guardado tiene una sola forma, y la
// vista de lectura y los reportes siguen leyendo las mismas claves sin
// migración ni casos especiales. `hermanos` guarda sus hijos,
// `situacionPadres` su situación de pareja, `terapiasPrevias` sus
// acompañamientos anteriores.
//
// Fuera quedan los campos que son del niño y no de ella: embarazo y parto,
// salud actual, hitos del desarrollo, relación con pares, y toda la sección de
// escolaridad. También la fecha de nacimiento y el grado escolar, que
// pideDatosDeNino ya excluye de la ficha.
export const ANAMNESIS_ACUDIENTE = [
  {
    titulo: "Datos generales",
    filas: [
      [{ name: "nombre", label: "Nombre completo" }],
      [
        { name: "telefono", label: "Teléfono de contacto" },
        { name: "correo", label: "Correo" },
      ],
    ],
  },
  {
    titulo: "Motivo de consulta",
    filas: [
      [{ name: "motivoConsulta", label: "¿Por qué llega a Pautas de Crianza?", multiline: true, rows: 3 }],
    ],
  },
  {
    titulo: "Situación familiar",
    filas: [
      [{ name: "composicionFamiliar", label: "Composición familiar (con quién vive)", multiline: true, rows: 2 }],
      [{ name: "hermanos", label: "Hijos (nombres y edades)" }],
      [{ name: "situacionPadres", label: "Situación de pareja / coparentalidad" }],
      [{ name: "dinamicaFamiliar", label: "Dinámica familiar relevante", multiline: true, rows: 2 }],
    ],
  },
  {
    titulo: "Situación actual",
    filas: [
      [{ name: "fortalezas", label: "Fortalezas como madre o padre", multiline: true, rows: 2 }],
      [{ name: "dificultades", label: "Principales dificultades en la crianza", multiline: true, rows: 3 }],
      [{ name: "estadoEmocional", label: "Estado emocional", multiline: true, rows: 2 }],
      [{ name: "terapiasPrevias", label: "Acompañamientos o terapias previas", multiline: true, rows: 2 }],
    ],
  },
  {
    titulo: "Observaciones adicionales",
    filas: [
      [{ name: "observaciones", label: "", multiline: true, rows: 3 }],
    ],
  },
];

// Los campos de la anamnesis del acudiente en una sola lista, para la vista de
// lectura: mismo orden que el formulario, y sin los de identidad, que ya están
// en el encabezado de la ficha.
export function resumenAnamnesisAcudiente(fields = {}) {
  const IDENTIDAD = new Set(["nombre", "telefono", "correo"]);
  return ANAMNESIS_ACUDIENTE.flatMap((seccion) =>
    seccion.filas.flat()
      .filter((campo) => !IDENTIDAD.has(campo.name))
      // Una etiqueta vacía en el formulario se apoya en el título de su
      // sección — "Observaciones adicionales" es la sección, no el campo — y en
      // la lectura ese título es el que sirve de rótulo.
      .map((campo) => [campo.label || seccion.titulo, fields[campo.name]])
      .filter(([, valor]) => valor)
  );
}

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

// El consentimiento informado: cómo se titula y qué dice.
//
// Vive aquí porque se muestra en dos sitios —el formulario de la ficha y la
// página de firma a distancia, que es otra pantalla y hasta otra sesión— y
// tenerlo escrito dos veces ya se notó: la página de firma seguía pidiéndole a
// una madre de Pautas de Crianza que autorizara "en calidad de representante
// legal" a su propio expediente.
//
// El de Pautas de Crianza es el texto que dio la dirección, literal. No
// autoriza la evaluación de un niño: acepta participar, y acota hasta dónde
// llega la confidencialidad.
//
// El del niño lleva su nombre en medio de la frase y en negrita. Va como
// {nombre} dentro del texto, y partesConsentimiento lo reparte: así el texto
// sigue siendo una sola cadena que se puede leer, cambiar y comparar de un
// vistazo, en vez de tres trozos de JSX.
export function textoConsentimiento(persona) {
  return esAcudiente(persona)
    ? {
        titulo: "Consentimiento informado Pautas de Crianza",
        texto: "Acepto participar voluntariamente en un espacio confidencial de orientación, dirigido a fortalecer las prácticas de crianza y el bienestar familiar. Comprendo que la confidencialidad podrá limitarse únicamente ante situaciones de riesgo o por requerimiento legal.",
      }
    : {
        titulo: "Consentimiento informado",
        texto: "Yo, en calidad de representante legal de {nombre}, autorizo su evaluación y/o acompañamiento terapéutico en Aira Learning Hub. Comprendo el alcance del servicio y que la información compartida será confidencial, salvo ante una situación de riesgo o requerimiento legal.",
      };
}

// Parte el texto del consentimiento en trozos para pintarlo, marcando en
// negrita el nombre que va donde está {nombre}.
//
// Se hace aquí y no en cada pantalla porque son dos —la ficha y la página de
// firma a distancia— y ya se vio lo que pasa cuando el consentimiento se
// escribe por duplicado.
export function partesConsentimiento(texto, nombre) {
  if (!texto) return [];
  const trozos = texto.split("{nombre}");
  return trozos.flatMap((t, i) => (
    i === 0 ? [{ t }] : [{ t: nombre || "", negrita: true }, { t }]
  )).filter((p) => p.t !== "");
}

// Cómo se rotula el campo de recomendaciones de una sesión.
//
// "Para casa / escuela" es el reparto de un niño: una parte va a los padres y
// otra al colegio. En Pautas de Crianza la sesión es con la madre y las
// recomendaciones son para ella — no hay escuela a la que mandarlas, y el
// rótulo hacía dudar de si el campo era el correcto.
export function textoRecomendaciones(persona) {
  return esAcudiente(persona)
    ? {
        titulo: "Pautas y recomendaciones",
        placeholder: "Pautas acordadas para practicar en casa hasta la próxima sesión...",
      }
    : {
        titulo: "Recomendaciones para casa / escuela",
        placeholder: "Indicaciones para los padres o el equipo escolar...",
      };
}

// Cómo se nombra a quien acompaña, para la ficha.
export function textoDeVinculo(persona, todos = []) {
  if (!esAcudiente(persona)) return null;
  if (!persona.acudienteDe) return "Sin hijo o hija en el centro";
  const hijo = todos.find((c) => c.id === persona.acudienteDe);
  return hijo ? `Madre o padre de ${hijo.name} ${hijo.lastName || ""}`.trim() : null;
}
