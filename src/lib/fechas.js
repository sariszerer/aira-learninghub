// Normaliza lo que el formulario pone en una columna DATE.
//
// Un <input type="date"> vacio vale "", y Postgres rechaza "" en una columna
// date con 22007 invalid input syntax. Eso fue exactamente lo que hizo
// desaparecer la primera escuela de gabinete: el insert reventaba, el store se
// tragaba el error con un console.error y la pantalla seguia mostrando la
// escuela recien creada. Solo al refrescar se veia que nunca existio.
//
// Se aplica en TODA columna de fecha al escribir, no solo donde ya paso: la
// cadena vacia llega desde cualquier campo opcional que el usuario deje en
// blanco, y acordarse caso por caso es como se llego hasta aqui.
export function fecha(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
