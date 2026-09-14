// Cómo se lee "última conexión" en la lista del equipo.
//
// El valor crudo no sirve: una fecha de hace tres semanas y un "nunca" se
// parecen en la pantalla y significan cosas distintas. Nunca entrado es una
// tarea pendiente de la administración — hay que mandarle su acceso —; hace
// tres semanas es solo información.

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

export function textoDeConexion(iso, ahora = Date.now()) {
  if (!iso) return { texto: "Nunca ha entrado", tono: "pendiente" };

  const cuando = new Date(iso).getTime();
  if (Number.isNaN(cuando)) return { texto: "—", tono: "neutro" };

  const desde = ahora - cuando;
  // Un reloj adelantado en el móvil de quien mira no debe producir "en 3 horas".
  if (desde < 2 * MINUTO) return { texto: "Ahora mismo", tono: "reciente" };
  if (desde < HORA) return { texto: `Hace ${Math.round(desde / MINUTO)} min`, tono: "reciente" };
  if (desde < DIA) {
    const h = Math.round(desde / HORA);
    return { texto: `Hace ${h} h`, tono: "reciente" };
  }
  const dias = Math.round(desde / DIA);
  if (dias === 1) return { texto: "Ayer", tono: "reciente" };
  if (dias < 30) return { texto: `Hace ${dias} días`, tono: "neutro" };
  const meses = Math.round(dias / 30);
  return { texto: meses === 1 ? "Hace un mes" : `Hace ${meses} meses`, tono: "lejano" };
}
