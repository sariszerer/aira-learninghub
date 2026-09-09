// Qué le falta a un formulario para poder guardarse.
//
// Existe porque el patrón anterior era desactivar el botón: el usuario rellena,
// pulsa Guardar y no pasa nada, sin una palabra de por qué. Un botón muerto no
// es una validación, es un error mudo — y en un formulario largo, con el campo
// que falta fuera de la pantalla, es indistinguible de que la aplicación se
// haya colgado.
//
// `campos` es una lista de pares [cumple, "lo que falta"]. El texto se escribe
// en minúscula y sin artículo inicial redundante, porque se compone dentro de
// la frase: ["el nombre", "la fecha"] → "Faltan el nombre y la fecha."
export function queFalta(campos = []) {
  const faltan = campos.filter(([cumple]) => !cumple).map(([, texto]) => texto);
  if (faltan.length === 0) return null;
  if (faltan.length === 1) return `Falta ${faltan[0]}.`;
  const ultimo = faltan[faltan.length - 1];
  return `Faltan ${faltan.slice(0, -1).join(", ")} y ${ultimo}.`;
}
