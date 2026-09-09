// Cálculo de la rejilla del calendario: qué días entran en la vista y dónde
// se coloca cada cita dentro del día.
//
// Todo con fechas en texto "AAAA-MM-DD" y minutos desde medianoche, nunca con
// objetos Date sobre la zona del navegador. El centro está en Panamá y quien
// mira puede no estarlo: construir un Date de "2026-09-09" en otro huso lo
// corre un día, y la semana entera se desplaza.

export const DIAS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

// La semana empieza en lunes, como el calendario del centro y el de cualquier
// colegio de Panamá. Date.getDay() cuenta desde domingo, de ahí el ajuste.
export function inicioDeSemana(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  const desdeLunes = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - desdeLunes);
  return dt.toISOString().slice(0, 10);
}

export function sumarDias(fecha, n) {
  const [a, m, d] = fecha.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function diasDeSemana(fecha) {
  const lunes = inicioDeSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

// El rango que se le pide a Google, con el huso fijo de Panamá: no tiene
// horario de verano, así que el desfase es el mismo todo el año.
export function rangoDeVista(vista, fecha) {
  const dias = vista === "dia" ? [fecha]
    : vista === "mes" ? diasDeMes(fecha)
    : diasDeSemana(fecha);
  return {
    desde: `${dias[0]}T00:00:00-05:00`,
    hasta: `${dias[dias.length - 1]}T23:59:59-05:00`,
  };
}

export function agruparPorDia(eventos = []) {
  const mapa = new Map();
  for (const e of eventos) {
    if (!mapa.has(e.fecha)) mapa.set(e.fecha, []);
    mapa.get(e.fecha).push(e);
  }
  return mapa;
}

// Reparte en columnas las citas que se pisan.
//
// Es lo que hace honesta una vista de semana. En este centro se solapan de
// verdad: el 9 de septiembre hay dos citas a las 2:45 con especialistas
// distintas, y otras dos a las 4:00. Dibujadas una encima de otra, la segunda
// desaparece y la agenda miente sobre la carga del día.
//
// Se agrupan en racimos de citas encadenadas por solape, y dentro de cada
// racimo cada una toma la primera columna libre. El ancho lo fija el racimo
// entero, no la cita: así dos que se pisan ocupan media caja cada una y se ven
// las dos completas.
//
// SE REPARTE POR DÍA. Sin eso, la comparación era solo de horas y dos citas de
// días distintos a la misma hora contaban como solapadas: una semana con una
// cita diaria a las 4 partía cada día en cinco columnas y los bloques salían a
// un quinto de ancho, ilegibles. Y al bajar de Mes a Día, mientras llegaban los
// datos del día, el mes entero se repartía como si fuera una sola jornada.
export function repartirSolapes(eventos = []) {
  const porDia = new Map();
  for (const e of eventos) {
    const dia = e.fecha || "";
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push(e);
  }
  return [...porDia.values()].flatMap(repartirUnDia);
}

function repartirUnDia(eventos) {
  const conHora = eventos
    .filter((e) => e.inicioMin != null)
    .sort((a, b) => a.inicioMin - b.inicioMin || a.finMin - b.finMin);

  const salida = [];
  let racimo = [];
  let finDelRacimo = -1;

  const cerrar = () => {
    if (!racimo.length) return;
    // Las columnas se asignan buscando la primera libre; el total es el máximo
    // simultáneo del racimo, no cuántas citas tiene.
    const columnas = [];
    for (const e of racimo) {
      let i = columnas.findIndex((fin) => fin <= e.inicioMin);
      if (i === -1) { i = columnas.length; columnas.push(0); }
      columnas[i] = e.finMin;
      e._col = i;
    }
    for (const e of racimo) salida.push({ ...e, columna: e._col, columnas: columnas.length });
    racimo = [];
    finDelRacimo = -1;
  };

  for (const e of conHora) {
    if (racimo.length && e.inicioMin >= finDelRacimo) cerrar();
    racimo.push(e);
    finDelRacimo = Math.max(finDelRacimo, e.finMin);
  }
  cerrar();
  return salida;
}

// Franja horaria que hay que dibujar.
//
// Se ajusta a lo que hay, con un margen: una rejilla fija de 00:00 a 23:59
// dedica dos tercios del alto a horas en las que el centro está cerrado, y deja
// las citas apretadas en una banda. Si no hay nada con hora, se cae a la jornada
// habitual para que la rejilla no salga vacía ni de altura cero.
export function franjaHoraria(eventos = [], { desde = 7, hasta = 19 } = {}) {
  const conHora = eventos.filter((e) => e.inicioMin != null);
  if (!conHora.length) return { desde, hasta };
  const min = Math.min(...conHora.map((e) => e.inicioMin));
  const max = Math.max(...conHora.map((e) => e.finMin));
  return {
    desde: Math.max(0, Math.floor(min / 60) - 1),
    hasta: Math.min(24, Math.ceil(max / 60) + 1),
  };
}

// ── Mes ──────────────────────────────────────────────────────────────────────

// La rejilla del mes se dibuja por SEMANAS COMPLETAS, así que arranca en el
// lunes anterior al día 1 y termina en el domingo posterior al último día. Los
// días que sobran son del mes vecino y se pintan apagados, pero llevan sus
// citas: si no, la primera fila del mes saldría medio vacía sin motivo visible.
//
// El número de filas se calcula, no se fija en 6. Febrero de un año no bisiesto
// que empieza en lunes cabe en 4, y la mayoría de meses en 5; una rejilla de 6
// fijas deja una fila entera en blanco al pie.
export function diasDeMes(fecha) {
  const [a, m] = fecha.split("-").map(Number);
  const primero = `${a}-${String(m).padStart(2, "0")}-01`;
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);

  const arranque = inicioDeSemana(primero);
  const cierre = sumarDias(inicioDeSemana(ultimo), 6);

  const dias = [];
  for (let d = arranque; d <= cierre; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

export function esDelMes(dia, fecha) {
  return dia.slice(0, 7) === fecha.slice(0, 7);
}

// Mover de mes conserva el día cuando existe y lo recorta cuando no.
//
// Sin recortar, ir de 31 de enero a febrero daría "2026-02-31", que Date
// interpreta como 3 de marzo: pulsar la flecha una vez saltaría dos meses.
export function sumarMeses(fecha, n) {
  const [a, m, d] = fecha.split("-").map(Number);
  const total = (a * 12 + (m - 1)) + n;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function etiquetaMes(fecha) {
  const [a, m] = fecha.split("-").map(Number);
  return `${MESES[m - 1]} de ${a}`;
}
