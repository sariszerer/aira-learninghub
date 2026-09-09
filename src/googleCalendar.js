// Agenda del centro.
//
// El calendario es UNO — airalearninghub@gmail.com — y es del centro, no el de
// cada persona. Por eso ya no se pide autorización a nadie: lo lee el servidor
// con una cuenta de servicio y aquí solo se pide.
//
// Lo anterior era OAuth desde el navegador, con la cuenta de Google de cada
// quien. Se cayó por donde tenía que caerse: la app de Google está en modo
// Testing, así que solo entraban las cuentas de la lista de probadores y a
// quien no estuviera le salía 403 access_denied. Además el permiso duraba una
// hora y había que reconectar a diario.

import { supabase } from "./supabase.js";
import { filasDeEventos } from "./lib/agenda.js";

// El rango lo arma quien llama (rangoDeVista): el mismo endpoint sirve para un
// dia y para una semana, y la funcion ya recibia desde/hasta desde el principio.
export async function fetchCalendarEvents({ desde, hasta }) {
  const { data, error } = await supabase.functions.invoke("calendario", {
    body: { desde, hasta },
  });

  // functions.invoke envuelve el fallo y pierde el cuerpo de la respuesta, que
  // es donde va el motivo. Sin esto, un calendario sin compartir y una sesión
  // caducada se veían igual: "Failed to send a request".
  if (error) {
    const detalle = await error.context?.json?.().catch(() => null);
    throw new Error(detalle?.error || "No se pudo cargar la agenda");
  }
  if (data?.error) throw new Error(data.error);

  return filasDeEventos(data?.eventos || []);
}
