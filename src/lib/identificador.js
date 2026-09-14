// Identificadores nuevos para filas que aun no existen en la base.

// El reloj no basta.
//
// "Pegar varios" crea los objetivos en un bucle apretado: los ocho se crean
// dentro del mismo milisegundo, asi que `o-${Date.now()}` les daba a todos el
// MISMO identificador. En pantalla se veian los ocho — son ocho objetos
// distintos en el array — pero upsertObjective escribe por id, asi que las
// ocho llamadas machacaban la misma fila y al recargar quedaba una. Sarita
// pego una lista del plan de trabajo y despues del refresco quedaban dos.
//
// El contador lo arregla de raiz: dentro de un mismo milisegundo va sumando, y
// al cambiar de milisegundo vuelve a empezar. Mientras la pestana viva, dos
// llamadas no pueden devolver lo mismo.
let ultimoMilisegundo = 0;
let dentroDelMismo = 0;

export function nuevoId(prefijo) {
  const ahora = Date.now();
  if (ahora === ultimoMilisegundo) {
    dentroDelMismo += 1;
  } else {
    ultimoMilisegundo = ahora;
    dentroDelMismo = 0;
  }
  return `${prefijo}-${ahora}-${dentroDelMismo}`;
}
