// Genera la contraseña temporal que la administración le pasa a alguien.
//
// Con palabras y no con caracteres al azar. Una clave como "xK7#pQ2v" hay que
// deletrearla por teléfono letra a letra, se copia mal y se apunta en un papel;
// "salta-nube-verde-47" se dicta de una vez y se escribe sin dudar. Y es más
// larga, que es lo que de verdad cuesta romper.
//
// Es temporal: la aplicación obliga a cambiarla en cuanto la persona entra.

// Palabras cortas, sin tildes ni ñ — se teclean igual en cualquier móvil — y sin
// pares que se confundan al dictar.
const PALABRAS = [
  "salta", "nube", "verde", "rio", "gato", "luna", "campo", "trigo",
  "playa", "monte", "sol", "libro", "fresa", "roble", "coral", "duna",
  "faro", "hielo", "jazmin", "lirio", "mango", "nieve", "olivo", "puerto",
  "rama", "sauce", "tigre", "uva", "valle", "zorro",
];

const CUANTAS = 3;

export function generarClaveTemporal(azar = Math.random) {
  // Se saca de una copia que va menguando, en vez de reintentar hasta que no
  // repita. Reintentar parecía inocente y era un cuelgue: con un azar que
  // devuelve siempre lo mismo — el de las pruebas — el bucle no terminaba
  // nunca. Así son tres vueltas exactas, pase lo que pase.
  const quedan = [...PALABRAS];
  const palabras = [];
  for (let i = 0; i < CUANTAS; i++) {
    const [p] = quedan.splice(Math.floor(azar() * quedan.length), 1);
    palabras.push(p);
  }
  const numero = 10 + Math.floor(azar() * 90);
  return `${palabras.join("-")}-${numero}`;
}

// El texto que se copia al portapapeles, listo para pegar en un mensaje.
//
// Lleva las dos cosas — correo y contraseña — porque mandar solo la contraseña
// obliga a la persona a adivinar con qué correo entra, y varias del equipo
// tienen una cuenta personal distinta de la del centro.
export function mensajeDeAcceso({ nombre, email, clave, url }) {
  return [
    `Hola ${nombre.split(" ")[0]}:`,
    "",
    `Tu acceso a AIRA Learning Hub:`,
    `  ${url}`,
    `  Correo: ${email}`,
    `  Contraseña temporal: ${clave}`,
    "",
    "Al entrar te va a pedir que la cambies por una tuya.",
  ].join("\n");
}
