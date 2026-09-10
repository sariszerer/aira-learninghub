// Traduce el fallo de Supabase al entrar.
//
// Antes TODO se decía igual: "Correo o contraseña incorrectos". La intención
// era buena — no confirmar si una cuenta existe — pero se llevó por delante
// todo lo demás. Un bloqueo por intentos, un correo sin confirmar o un
// servidor caído se leían como "te equivocaste de contraseña", y la persona
// probaba diez veces la contraseña correcta.
//
// Pasó de verdad: nueve personas sin poder entrar y la pantalla repitiendo el
// único mensaje que no ayudaba.
//
// La regla se mantiene donde importa: credenciales malas y correo inexistente
// siguen diciendo lo mismo. Lo que cambia es todo lo que NO es eso.
export function mensajeDeLogin(error) {
  const codigo = error?.code || error?.error_code || "";
  const texto = `${error?.message || ""}`.toLowerCase();
  const estado = error?.status;

  if (estado === 429 || /rate limit|too many/.test(texto)) {
    return {
      titulo: "Demasiados intentos",
      detalle: "El servidor bloqueó los intentos por un rato. Espera unos minutos y vuelve a probar — la contraseña puede estar bien.",
    };
  }

  if (codigo === "email_not_confirmed" || /not confirmed/.test(texto)) {
    return {
      titulo: "Falta confirmar el correo",
      detalle: "Tu cuenta existe pero el correo no está confirmado. Avisa a la administración del centro.",
    };
  }

  if (/user is banned|banned/.test(texto)) {
    return {
      titulo: "Cuenta suspendida",
      detalle: "Avisa a la administración del centro.",
    };
  }

  // Sin respuesta del servidor: no es culpa de la contraseña y decir que sí lo
  // es manda a la persona a cambiarla para nada.
  if (/failed to fetch|networkerror|network request failed/.test(texto)) {
    return {
      titulo: "Sin conexión con el servidor",
      detalle: "Revisa tu conexión e inténtalo otra vez.",
    };
  }

  if (codigo === "invalid_credentials" || /invalid login credentials/.test(texto)) {
    return {
      titulo: "Correo o contraseña incorrectos",
      // Se dice lo mismo tanto si el correo no existe como si la contraseña
      // falla: distinguirlos le confirma a quien sondea que esa cuenta existe.
      detalle: "Si la administración te pasó una contraseña temporal, cópiala tal cual, sin espacios al principio ni al final.",
    };
  }

  return {
    titulo: "No se pudo entrar",
    detalle: error?.message || "Vuelve a intentarlo en un momento.",
  };
}
