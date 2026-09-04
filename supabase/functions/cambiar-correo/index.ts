// Cambio de correo de un especialista.
//
// El correo vive en DOS sitios: public.users.email, que es lo que muestra la
// aplicacion, y auth.users.email, que es con lo que la persona INICIA SESION.
// Cambiar solo el primero deja la pantalla diciendo una cosa y el acceso
// funcionando con otra — y nadie lo descubre hasta que alguien no puede entrar.
// Por eso el campo estaba deshabilitado en la interfaz: mover uno solo era peor
// que no mover ninguno.
//
// Tocar auth.users exige la clave service_role, que no puede vivir en el
// navegador. De ahi esta funcion.
//
// Orden y reversion, igual que en el alta:
//   1. verificar quien llama, con su propio token, y que pueda gestionar usuarios
//   2. cambiar auth.users — el que decide si se puede entrar
//   3. cambiar public.users
// Si 3 falla, se deshace 2. Al reves seria peor: la persona se quedaria sin
// poder entrar con un correo que la aplicacion ya no muestra.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const CORREO_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ── 1. Quién llama ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Falta el token de sesión" }, 401);
  }

  const comoUsuario = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  // getUser() SIN argumento lee la sesion del almacenamiento del cliente, y en
  // una funcion edge no hay ninguno: devolvia "sesion invalida" sin llegar a
  // preguntarle al servidor de auth. Por eso el token va explicito.
  const token = authHeader.slice("Bearer ".length);
  const { data: sesion, error: errSesion } = await comoUsuario.auth.getUser(token);
  if (errSesion || !sesion?.user) return json({ error: "Sesión inválida" }, 401);

  // Se pregunta por el PERMISO y no por el nombre del rol: desde la fase 3 de
  // roles, quien administra usuarios puede llamarse como quiera.
  const { data: puede } = await comoUsuario.rpc("has_perm", { p: "user:manage" });
  if (puede !== true) {
    return json({ error: "No tienes permiso para cambiar correos" }, 403);
  }

  // ── 2. Entrada ────────────────────────────────────────────────────────────
  let cuerpo: { id?: string; email?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const id = (cuerpo.id ?? "").trim();
  const nuevo = (cuerpo.email ?? "").trim().toLowerCase();
  if (!id) return json({ error: "Falta el especialista" }, 400);
  if (!CORREO_VALIDO.test(nuevo)) return json({ error: "El correo no es válido" }, 400);

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  const { data: destino, error: errDestino } = await admin
    .from("users")
    .select("id, name, email, auth_id")
    .eq("id", id)
    .single();

  if (errDestino || !destino) return json({ error: "No se encontró el especialista" }, 404);
  if ((destino.email ?? "").toLowerCase() === nuevo) {
    return json({ ok: true, sinCambios: true });
  }

  // El correo es la credencial de acceso: si otra cuenta ya lo usa, cambiarlo
  // aqui la dejaria inaccesible o fallaria a medias.
  const { data: ocupado } = await admin
    .from("users").select("id").ilike("email", nuevo).neq("id", id).maybeSingle();
  if (ocupado) return json({ error: "Ya hay otro usuario con ese correo" }, 409);

  const anterior = destino.email;

  // ── 3. auth.users ─────────────────────────────────────────────────────────
  if (destino.auth_id) {
    const { error: errAuth } = await admin.auth.admin.updateUserById(destino.auth_id, {
      email: nuevo,
      // Se da por confirmado: lo cambia una administradora desde el panel, no
      // la persona desde su bandeja. Sin esto la cuenta queda pendiente de una
      // confirmacion que nadie va a recibir y no podria iniciar sesion.
      email_confirm: true,
    });
    if (errAuth) {
      return json({ error: "No se pudo cambiar la cuenta de acceso: " + errAuth.message }, 400);
    }
  }

  // ── 4. public.users ───────────────────────────────────────────────────────
  const { error: errPerfil } = await admin.from("users").update({ email: nuevo }).eq("id", id);

  if (errPerfil) {
    // Deshacer el paso anterior: si no, la persona entra con el correo nuevo
    // pero la aplicacion sigue mostrando el viejo, y nadie sabe cual es cual.
    if (destino.auth_id && anterior) {
      await admin.auth.admin.updateUserById(destino.auth_id, {
        email: anterior,
        email_confirm: true,
      });
    }
    return json({ error: "No se pudo actualizar el perfil: " + errPerfil.message }, 500);
  }

  return json({
    ok: true,
    anterior,
    nuevo,
    // Lo tiene que saber quien administra: a partir de ahora entra con el nuevo.
    aviso: `${destino.name} deberá iniciar sesión con ${nuevo}. Su contraseña no cambia.`,
    sinCuentaDeAcceso: !destino.auth_id,
  });
});
