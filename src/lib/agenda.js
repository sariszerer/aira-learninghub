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

export function filaDeEvento(ev = {}) {
  return {
    id: ev.id,
    title: ev.summary || "Sin título",
    time: horaDe(ev.start?.dateTime || ev.start?.date || ""),
    endTime: horaDe(ev.end?.dateTime || ev.end?.date || ""),
    raw: ev.summary || "",
    description: ev.description || "",
    specialist: "",
    cancelled: estaCancelada(ev),
  };
}

export function filasDeEventos(items = []) {
  return items.map(filaDeEvento);
}
