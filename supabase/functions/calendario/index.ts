// Lee la agenda del centro y se la devuelve a quien tenga permiso.
//
// Antes esto lo hacia el navegador: cada persona autorizaba su cuenta de Google
// y leia el calendario airalearninghub@gmail.com con su propio token. Eso tenia
// tres problemas, y el tercero es el que lo rompio:
//
//  1. El permiso duraba una hora. Habia que volver a pulsar "Conectar" a diario.
//  2. Quien podia ver la agenda lo decidia Google, no AIRA.
//  3. La app de Google esta en modo Testing, asi que solo entraban las cuentas
//     de la lista de probadores. Sarita no estaba y le salia 403 access_denied.
//
// El calendario es UNO y es del centro, no el de cada quien. Asi que lo lee el
// servidor con una cuenta de servicio a la que se le compartio ese calendario,
// y nadie tiene que autorizar nada. El permiso vuelve a decidirlo AIRA:
// calendar:view, que tienen direccion y especialistas pero no la tutora — su
// alcance es un solo nino y esta agenda lleva los titulos de las citas de todos
// los pacientes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CALENDARIO = "airalearninghub@gmail.com";
const AMBITO = "https://www.googleapis.com/auth/calendar.readonly";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Token de Google a partir de la cuenta de servicio ────────────────────────

function base64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemABytes(pem: string) {
  const cuerpo = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(cuerpo), (c) => c.charCodeAt(0));
}

// El token dura una hora y la funcion puede reutilizar el mismo isolate entre
// llamadas: guardarlo evita una ida y vuelta a Google en cada carga de agenda.
// Se renueva un minuto antes de caducar, para no usarlo justo al filo.
let cache: { token: string; expira: number } | null = null;

async function tokenDeGoogle(sa: { client_email: string; private_key: string }) {
  if (cache && Date.now() < cache.expira - 60_000) return cache.token;

  const ahora = Math.floor(Date.now() / 1000);
  const texto = new TextEncoder();
  const parte = (o: unknown) => base64url(texto.encode(JSON.stringify(o)));
  const sinFirmar =
    parte({ alg: "RS256", typ: "JWT" }) + "." +
    parte({
      iss: sa.client_email,
      scope: AMBITO,
      aud: "https://oauth2.googleapis.com/token",
      iat: ahora,
      exp: ahora + 3600,
    });

  const clave = await crypto.subtle.importKey(
    "pkcs8",
    pemABytes(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", clave, texto.encode(sinFirmar));
  const jwt = `${sinFirmar}.${base64url(new Uint8Array(firma))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const datos = await res.json();
  if (!res.ok) throw new Error(datos.error_description || datos.error || "Google rechazó la cuenta de servicio");

  cache = { token: datos.access_token, expira: Date.now() + datos.expires_in * 1000 };
  return cache.token;
}

// La credencial se acepta como JSON o como el mismo JSON en base64.
//
// El JSON trae 13 saltos de linea y 44 comillas dobles, y eso no sobrevive a
// cualquier camino hasta aqui: al ponerlo con la CLI desde Windows, la linea de
// comandos se vuelve a interpretar en el proceso hijo y llega troceado. Se
// guardo asi una vez y la funcion respondia "credencial mal formada".
//
// base64 no tiene comillas, ni saltos, ni espacios: no hay nada que interpretar
// por el camino. Se admiten los dos formatos porque pegarlo tal cual desde el
// panel de Supabase si funciona, y no hay motivo para obligar a convertirlo.
function leerCuenta(texto: string) {
  const limpio = texto.trim();
  if (limpio.startsWith("{")) return JSON.parse(limpio);
  return JSON.parse(new TextDecoder().decode(
    Uint8Array.from(atob(limpio), (c) => c.charCodeAt(0)),
  ));
}

// ── Petición ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const CUENTA = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Falta el token de sesión" }, 401);

  const comoUsuario = createClient(URL_SB, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  // El token va explicito: getUser() sin argumento lee la sesion del
  // almacenamiento del cliente, y en una funcion edge no hay ninguno.
  const token = authHeader.slice("Bearer ".length);
  const { data: sesion, error: errSesion } = await comoUsuario.auth.getUser(token);
  if (errSesion || !sesion?.user) return json({ error: "Sesión inválida" }, 401);

  const { data: puede } = await comoUsuario.rpc("has_perm", { p: "calendar:view" });
  if (!puede) return json({ error: "No tienes permiso para ver la agenda" }, 403);

  // El estado de configuracion del servidor se comprueba DESPUES de la sesion y
  // el permiso: es informacion sobre la instalacion y no tiene por que llegarle
  // a quien todavia no ha demostrado quien es.
  if (!CUENTA) {
    return json({ error: "El calendario no está configurado todavía en el servidor." }, 503);
  }

  const { desde, hasta } = await req.json().catch(() => ({}));
  if (!desde || !hasta) return json({ error: "Faltan las fechas del rango" }, 400);

  let sa: { client_email: string; private_key: string };
  try {
    sa = leerCuenta(CUENTA);
  } catch {
    return json({ error: "La credencial de Google del servidor está mal formada." }, 500);
  }

  try {
    const acceso = await tokenDeGoogle(sa);
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARIO)}/events`,
    );
    url.searchParams.set("timeMin", desde);
    url.searchParams.set("timeMax", hasta);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const res = await fetch(url, { headers: { Authorization: `Bearer ${acceso}` } });
    const datos = await res.json();

    if (!res.ok) {
      // 404 aqui casi siempre significa lo mismo: la cuenta de servicio existe
      // pero nadie le compartio el calendario. Se dice, porque el mensaje crudo
      // de Google ("Not Found") no le sirve a nadie.
      const detalle = res.status === 404
        ? `El calendario ${CALENDARIO} no está compartido con la cuenta de servicio (${sa.client_email}).`
        : datos?.error?.message || "Google no devolvió la agenda";
      return json({ error: detalle }, 502);
    }

    return json({ eventos: datos.items ?? [] });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
