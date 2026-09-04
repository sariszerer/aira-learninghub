// Composicion de los tres reportes que define Formatos_Reportes_AIRA.docx:
// Reporte de Evolucion, Historial Clinico Completo y Reporte para Padres.
//
// Todo aqui es puro: recibe datos y devuelve datos. El pintado vive en
// src/reports/. Esa separacion existe porque las secciones del documento son
// reglas de negocio — que cuenta como ausencia, como se traduce un nivel GAS a
// lenguaje para padres — y una regla dentro de un JSX no se puede probar.

import { fmtDate } from "./format.js";

// ── Asistencia ───────────────────────────────────────────────────────────────

export const ASISTENCIA = {
  asistio: { label: "Asistió", corto: "Asistió" },
  cancelo: { label: "Cancelada", corto: "Cancel." },
  no_show: { label: "No asistió", corto: "No asistió" },
  reprogramada: { label: "Reprogramada", corto: "Reprog." },
};

// "Sesiones programadas vs. asistidas en el periodo; ausencias y cancelaciones."
//
// Programadas es el total de filas: en este sistema una sesion existe porque se
// agendo, y la asistencia dice que paso con ella. El porcentaje excluye las
// reprogramadas del denominador — una sesion movida de fecha no es una falta,
// y contarla como tal castigaria a familias que avisaron y reagendaron.
export function resumenAsistencia(sesiones = []) {
  const conteo = { asistio: 0, cancelo: 0, no_show: 0, reprogramada: 0 };
  for (const s of sesiones) {
    const a = s.attendance || "asistio";
    if (a in conteo) conteo[a]++;
  }
  const programadas = sesiones.length;
  const base = programadas - conteo.reprogramada;
  return {
    programadas,
    asistidas: conteo.asistio,
    canceladas: conteo.cancelo,
    ausencias: conteo.no_show,
    reprogramadas: conteo.reprogramada,
    porcentaje: base > 0 ? Math.round((conteo.asistio / base) * 100) : null,
  };
}

// ── Escala GAS ───────────────────────────────────────────────────────────────

// GAS puntua de -2 a +2 y 0 es la meta esperada.
export const NIVELES_GAS = [
  { valor: -2, label: "Mucho menos de lo esperado" },
  { valor: -1, label: "Línea base — sin cambio" },
  { valor: 0, label: "Meta esperada" },
  { valor: 1, label: "Algo más de lo esperado" },
  { valor: 2, label: "Mucho más de lo esperado" },
];

export function etiquetaGas(valor) {
  return NIVELES_GAS.find((n) => n.valor === valor)?.label || null;
}

// "Traducidos del nivel GAS a lenguaje para padres." Cuando el objetivo aun no
// tiene GAS se cae al semaforo de la interfaz, que siempre existe: el reporte
// para la familia no puede quedarse en blanco por un campo clinico sin llenar.
export function progresoParaFamilia(objetivo) {
  const g = objetivo?.gasCurrent;
  if (g != null) {
    if (g >= 0) return "Logrado";
    if (g === -1) return "En progreso";
    return "Iniciando";
  }
  return { logrado: "Logrado", proceso: "En progreso", apoyo: "Iniciando" }[objetivo?.status] || "En progreso";
}

// ── Reporte de Evolución ─────────────────────────────────────────────────────

// "Por cada objetivo: nivel GAS actual vs. linea base y meta, descripcion
// cualitativa del progreso, evidencia u observacion clinica que lo respalda."
//
// La evidencia son las observaciones de las sesiones donde ese objetivo se
// trabajo, no todas las del periodo: el documento pide lo que respalda ESE
// objetivo.
export function avancePorObjetivo(objetivos = [], sesiones = []) {
  return objetivos.map((obj) => {
    const trabajos = sesiones
      .flatMap((s) =>
        (s.objectivesWorked || [])
          .filter((ow) => ow.objectiveId === obj.id)
          .map((ow) => ({ estado: ow.status, sesion: s }))
      )
      .sort((a, b) => a.sesion.date.localeCompare(b.sesion.date));

    return {
      objetivo: obj,
      vecesTrabajado: trabajos.length,
      evidencia: trabajos
        .filter((t) => (t.sesion.observation || "").trim())
        .map((t) => ({ fecha: t.sesion.date, texto: t.sesion.observation.trim() })),
      gas: {
        base: obj.gasBaseline ?? null,
        meta: obj.gasTarget ?? null,
        actual: obj.gasCurrent ?? null,
        // Sin actual o sin meta no hay nada que comparar; devolver 0 fingiria
        // una medicion que nadie hizo.
        alcanzada: obj.gasCurrent != null && obj.gasTarget != null
          ? obj.gasCurrent >= obj.gasTarget
          : null,
      },
    };
  });
}

// "Avances puntuales que vale la pena resaltar en el periodo."
export function logrosDestacados(objetivos = [], sesiones = []) {
  const idsTrabajados = new Set(
    sesiones.flatMap((s) => (s.objectivesWorked || []).map((ow) => ow.objectiveId))
  );
  return objetivos.filter(
    (o) => (o.status === "logrado" || (o.gasCurrent != null && o.gasCurrent >= 0)) && idsTrabajados.has(o.id)
  );
}

// "Desafios actuales o areas donde el progreso es mas lento."
export function areasDeAtencion(objetivos = []) {
  return objetivos.filter(
    (o) => o.status === "apoyo" || (o.gasCurrent != null && o.gasCurrent <= -2)
  );
}

// ── Historial Clínico Completo ───────────────────────────────────────────────

// "Tabla: nombre, especialidad, periodo de atencion."
//
// El periodo sale de las sesiones reales y no de la lista de asignados: quien
// figura asignado pero nunca atendio no tiene periodo, y quien atendio y ya no
// esta asignado si debe aparecer en un historial longitudinal.
export function especialistasInvolucrados(sesiones = [], usuarios = [], asignados = []) {
  const porId = new Map();
  for (const s of sesiones) {
    if (!s.specialistId) continue;
    const e = porId.get(s.specialistId) || { fechas: [], especialidades: new Set(), sesiones: 0 };
    e.fechas.push(s.date);
    if (s.specialty) e.especialidades.add(s.specialty);
    e.sesiones++;
    porId.set(s.specialistId, e);
  }
  for (const id of asignados) if (!porId.has(id)) porId.set(id, { fechas: [], especialidades: new Set(), sesiones: 0 });

  return [...porId.entries()].map(([id, e]) => {
    const u = usuarios.find((x) => x.id === id);
    const ordenadas = e.fechas.slice().sort();
    return {
      id,
      nombre: u?.name || id,
      especialidad: [...e.especialidades].join(", ") || u?.specialty || "—",
      desde: ordenadas[0] || null,
      hasta: ordenadas[ordenadas.length - 1] || null,
      sesiones: e.sesiones,
    };
  }).sort((a, b) => (a.desde || "9999").localeCompare(b.desde || "9999"));
}

// "Por especialidad: fecha, especialista, instrumentos aplicados, hallazgos."
// Las evaluaciones y anamnesis viven en documents; el resto de tipos no.
export function evaluacionesIniciales(documentos = []) {
  return documentos
    .filter((d) => d.type === "evaluacion" || d.type === "anamnesis")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

// "Cada plan creado, en orden cronologico: fecha de inicio, especialista,
// objetivos (GAS), frecuencia."
//
// No hay tabla de planes: el plan de un paciente ES su conjunto de objetivos
// por disciplina. Se agrupan por area y se fecha con el objetivo mas antiguo,
// que es la aproximacion honesta a "fecha de inicio del plan".
export function planesPorDisciplina(objetivos = [], usuarios = []) {
  const porArea = new Map();
  for (const o of objetivos) {
    const area = o.area || "Sin disciplina";
    if (!porArea.has(area)) porArea.set(area, []);
    porArea.get(area).push(o);
  }
  return [...porArea.entries()].map(([area, lista]) => {
    const fechas = lista.map((o) => o.createdDate).filter(Boolean).sort();
    const ids = [...new Set(lista.map((o) => o.specialistId).filter(Boolean))];
    return {
      area,
      inicio: fechas[0] || null,
      objetivos: lista,
      especialistas: ids.map((id) => usuarios.find((u) => u.id === id)?.name || id),
    };
  }).sort((a, b) => (a.inicio || "9999").localeCompare(b.inicio || "9999"));
}

export function estadoDelPaciente(child) {
  const mapa = {
    activo: "Activo",
    pausa: "En pausa",
    alta: "De alta",
    inactivo: "Inactivo",
  };
  return mapa[child?.status] || "Activo";
}

// ── Utilidades de rango ──────────────────────────────────────────────────────

export function textoRango(desde, hasta) {
  if (!desde && !hasta) return "Todo el historial";
  if (!hasta) return `Desde ${fmtDate(desde)}`;
  if (!desde) return `Hasta ${fmtDate(hasta)}`;
  return `${fmtDate(desde)} — ${fmtDate(hasta)}`;
}

export function sesionesEnRango(sesiones = [], childId, desde, hasta) {
  return sesiones
    .filter((s) => s.childId === childId)
    .filter((s) => (!desde || s.date >= desde) && (!hasta || s.date <= hasta))
    .sort((a, b) => a.date.localeCompare(b.date));
}
