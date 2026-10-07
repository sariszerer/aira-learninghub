// Webhook de WhatsApp.
//
// Meta necesita una URL pública a la que llamar: una vez para comprobar que es
// nuestra (GET con un desafío), y después cada vez que una terapeuta responde
// o cambia el estado de un mensaje (POST).
//
// Va sin verify_jwt. Es obligatorio: Meta no manda un token de Supabase, manda
// lo suyo. Eso significa que CUALQUIERA puede llamar a esta URL, así que la
// autenticidad no la da el acceso sino la firma: cada POST viene con un HMAC
// del cuerpo hecho con el App Secret, y aquí se recalcula y se compara. Sin esa
// comprobación, cualquiera podría inventarse respuestas de las terapeutas.

import { createClient } from "jsr:@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";

const cabeceras = { "content-type": "application/json" };

// Comparación en tiempo constante.
//
// Un `===` sobre cadenas sale en cuanto encuentra el primer byte distinto, y
// ese tiempo se puede medir para ir adivinando la firma byte a byte. Con
// firmas HMAC es un ataque conocido, no una paranoia teórica.
function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

async function firmaValida(cuerpo: string, cabecera: string | null): Promise<boolean> {
  if (!APP_SECRET) return false;          // sin secreto no se valida nada: se rechaza
  if (!cabecera?.startsWith("sha256=")) return false;

  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo));
  const esperada = [...new Uint8Array(firma)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return igualesEnTiempoConstante(esperada, cabecera.slice("sha256=".length));
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── El apretón de manos de Meta ─────────────────────────────────────────
  // Solo ocurre al guardar la URL en el panel. Devuelve el desafío tal cual,
  // como texto plano: si va con comillas de JSON, Meta lo da por fallido.
  if (req.method === "GET") {
    const modo = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const desafio = url.searchParams.get("hub.challenge");

    if (modo === "subscribe" && token && VERIFY_TOKEN && igualesEnTiempoConstante(token, VERIFY_TOKEN)) {
      return new Response(desafio ?? "", { headers: { "content-type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // El cuerpo se lee como TEXTO y la firma se calcula sobre ese texto exacto.
  // Pasarlo antes por JSON.parse y volver a serializar cambia espacios y orden
  // de claves, y la firma deja de cuadrar aunque el mensaje sea legítimo.
  const crudo = await req.text();

  if (!await firmaValida(crudo, req.headers.get("x-hub-signature-256"))) {
    console.error("Firma inválida o ausente: se descarta el aviso.");
    return new Response("Forbidden", { status: 403 });
  }

  let aviso: any;
  try {
    aviso = JSON.parse(crudo);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Se guarda el aviso entero y crudo, y la lectura se hace después.
  //
  // Es a propósito: el formato de Meta cambia y trae campos que hoy no se usan.
  // Si se descarta lo que no se entiende, el día que haga falta no está. Y si
  // el procesado falla, el aviso ya está a salvo — Meta no lo reenvía
  // indefinidamente.
  const filas: Record<string, unknown>[] = [];
  for (const entrada of aviso?.entry ?? []) {
    for (const cambio of entrada?.changes ?? []) {
      const valor = cambio?.value ?? {};
      for (const mensaje of valor.messages ?? []) {
        filas.push({
          tipo: "mensaje",
          wa_id: mensaje.from ?? null,
          mensaje_id: mensaje.id ?? null,
          texto: mensaje.text?.body ?? null,
          crudo: mensaje,
        });
      }
      for (const estado of valor.statuses ?? []) {
        filas.push({
          tipo: "estado",
          wa_id: estado.recipient_id ?? null,
          mensaje_id: estado.id ?? null,
          texto: estado.status ?? null,
          crudo: estado,
        });
      }
    }
  }

  if (filas.length > 0) {
    const { error } = await supabase.from("whatsapp_eventos").insert(filas);
    // Se registra y se responde 200 igualmente: un error nuestro no debe hacer
    // que Meta reintente en bucle ni que marque el webhook como caído. El
    // aviso se pierde, y eso es visible en los logs.
    if (error) console.error("No se pudo guardar el aviso de WhatsApp:", error.message);
  }

  // Meta espera un 200 rápido. Si tarda o falla repetidamente, desactiva la
  // suscripción.
  return new Response(JSON.stringify({ recibidos: filas.length }), { headers: cabeceras });
});
