// Reglas de la contraseña que cada especialista establece la primera vez.
//
// Aparte de la pantalla porque la regla es de la clínica, no del formulario, y
// porque así se puede probar sin montar nada.

// DIEZ, no ocho, porque diez es lo que exige Supabase al guardar.
//
// Estaba en 8 y el servidor rechazaba con 422 "Password should be at least 10
// characters": la pantalla dejaba escribir una de ocho, la daba por buena, y
// el fallo llegaba después y en inglés. Quien no lo leyera se quedaba con la
// contraseña vieja creyendo que la había cambiado — y con la nueva, que nunca
// llegó a existir, no podía entrar.
//
// Si alguien cambia el mínimo en el panel de Supabase, tiene que cambiarlo
// aquí también. Mientras tanto mensajeDeGuardarContrasena traduce el rechazo
// por si vuelven a separarse.
export const MINIMO = 10;

// Se pide longitud y nada más — ni mayúscula obligatoria, ni símbolo, ni dígito.
//
// Es deliberado. Las reglas de composición empujan a "Aira2026!" y a apuntarla
// en un papel pegado al monitor; la longitud es lo único que de verdad cuesta
// romper. Aquí entran expedientes clínicos de menores, así que la contraseña
// importa: lo que no ayuda es hacerla difícil de recordar en vez de difícil de
// adivinar.
export function problemaConContrasena(clave, repetida) {
  if (!clave) return "Escribe una contraseña.";
  if (clave.length < MINIMO) return `La contraseña necesita al menos ${MINIMO} caracteres.`;
  if (/^\s|\s$/.test(clave)) return "La contraseña no puede empezar ni terminar con espacios.";
  if (repetida !== undefined && clave !== repetida) return "Las dos contraseñas no coinciden.";
  return null;
}

// Fuerza aproximada, solo para orientar mientras se escribe. No bloquea nada:
// una barra que dice "débil" y aun así deja continuar es honesta; una que
// bloquea acaba en la contraseña que el medidor aprueba, no en la que la
// persona recuerda.
export function fuerzaDeContrasena(clave = "") {
  if (clave.length < MINIMO) return { nivel: 0, texto: "Muy corta" };
  const variedad = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter((r) => r.test(clave)).length;
  // La longitud pesa más que la variedad, que es como funciona de verdad.
  if (clave.length >= 16 || (clave.length >= 12 && variedad >= 2)) {
    return { nivel: 3, texto: "Buena" };
  }
  if (clave.length >= 12 || variedad >= 3) return { nivel: 2, texto: "Aceptable" };
  return { nivel: 1, texto: "Débil" };
}

// ¿Esta carga de página viene de un enlace para establecer la contraseña?
//
// Supabase devuelve al usuario con los datos en el FRAGMENTO de la URL
// (#access_token=…&type=recovery), no en la query. Se mira el hash y, por si
// acaso, también la query: el enlace pasa por un redirector y no siempre llega
// igual.
export function esEnlaceDeContrasena(url = "") {
  const i = url.indexOf("#");
  const hash = i === -1 ? "" : url.slice(i + 1);
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  return /(^|&)type=recovery(&|$)/.test(hash)
      || /(^|&)type=recovery(&|$)/.test(query)
      || /(^|&)type=invite(&|$)/.test(hash);
}

// Traduce el fallo de Supabase al GUARDAR la contraseña, igual que
// mensajeDeLogin hace con el de entrar.
//
// El mensaje del servidor viene en inglés y llega tal cual a una pantalla que
// está entera en español. "Password should be at least 10 characters" no le
// dice nada a quien no lee inglés, y es justo el momento en que la persona
// necesita entender qué corregir.
export function mensajeDeGuardarContrasena(error) {
  const texto = `${error?.message || ""}`.toLowerCase();

  if (/at least (\d+) characters|password.*short/.test(texto)) {
    const n = (texto.match(/at least (\d+) characters/) || [])[1] || MINIMO;
    return {
      titulo: "La contraseña es muy corta",
      detalle: `Necesita al menos ${n} caracteres. Una frase que recuerdes funciona mejor que algo corto y retorcido.`,
    };
  }

  if (/expired|invalid|not found/.test(texto)) {
    return {
      titulo: "El enlace ya caducó",
      detalle: "Pide uno nuevo a la administración del centro.",
    };
  }

  if (/should be different|same as the old/.test(texto)) {
    return {
      titulo: "Esa es la contraseña que ya tenías",
      detalle: "Elige una distinta de la anterior.",
    };
  }

  if (/weak|pwned|compromised/.test(texto)) {
    return {
      titulo: "Esa contraseña es fácil de adivinar",
      detalle: "Aparece en listas de contraseñas filtradas. Elige otra.",
    };
  }

  if (/failed to fetch|networkerror|network request failed/.test(texto)) {
    return {
      titulo: "Sin conexión con el servidor",
      detalle: "Revisa tu conexión e inténtalo otra vez.",
    };
  }

  return {
    titulo: "No se pudo guardar la contraseña",
    detalle: error?.message || "Vuelve a intentarlo en un momento.",
  };
}
