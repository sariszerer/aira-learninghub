// Traduce un evento de Google Calendar a una fila de la agenda.
//
// Vive aparte del transporte porque es la única parte con criterio propio, y
// hasta ahora estaba enterrada en el módulo que hablaba con Google, sin una
// sola prueba, decidiendo qué cita aparece como cancelada en la pantalla de
// inicio de todo el equipo.

const ZONA = "America/Panama";

export function horaDe(iso) {
  // Un evento de día completo trae solo la fecha, sin hora: no se le inventa
  // una, se deja en blanco.
  if (!iso || !iso.includes("T")) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONA,
  });
}

// Una cita se da por cancelada de tres maneras distintas, y las tres se ven en
// este calendario:
//
//  - Google la marca status: "cancelled" cuando se borra de una serie.
//  - El especialista responde "no asistiré" desde su propio Google.
//  - O — lo más común aquí — alguien escribe CANCELADA en la descripción,
//    porque avisó la familia y la cita se deja visible a propósito.
//
// El texto se busca en la descripción Y en el título: se estaba mirando solo la
// descripción, así que un evento titulado "CANCELADA — Asher" salía como cita
// normal en la agenda del día.
export function estaCancelada(ev = {}) {
  if (ev.status === "cancelled") return true;
  if (ev.organizer?.responseStatus === "declined") return true;
  const texto = `${ev.summary || ""} ${ev.description || ""}`.toUpperCase();
  return texto.includes("CANCEL");
}

// Fecha del evento en la zona del centro, como texto AAAA-MM-DD.
//
// Se saca del desfase que ya trae el ISO y no construyendo un Date: quien mira
// la agenda puede estar en otro huso, y ahí una cita de las 8 de la noche se
// iría al día siguiente. El calendario es de Panamá y la agenda tiene que
// leerse igual desde cualquier parte.
export function fechaDe(iso) {
  if (!iso) return "";
  if (!iso.includes("T")) return iso.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // en-CA da directamente AAAA-MM-DD.
  return d.toLocaleDateString("en-CA", { timeZone: ZONA });
}

// Minutos desde medianoche, en hora de Panamá. Es lo que posiciona la cita en
// la rejilla; la cadena "9:45 AM" sirve para leerla, no para dibujarla.
export function minutosDe(iso) {
  if (!iso || !iso.includes("T")) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const [h, m] = d.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA,
  }).split(":").map(Number);
  return h * 60 + m;
}

export function filaDeEvento(ev = {}) {
  const ini = ev.start?.dateTime || ev.start?.date || "";
  const fin = ev.end?.dateTime || ev.end?.date || "";
  return {
    id: ev.id,
    title: ev.summary || "Sin título",
    time: horaDe(ini),
    endTime: horaDe(fin),
    fecha: fechaDe(ini),
    inicioMin: minutosDe(ini),
    finMin: minutosDe(fin),
    diaCompleto: !ini.includes("T"),
    raw: ev.summary || "",
    description: ev.description || "",
    specialist: "",
    cancelled: estaCancelada(ev),
  };
}

export function filasDeEventos(items = []) {
  return items.map(filaDeEvento);
}
