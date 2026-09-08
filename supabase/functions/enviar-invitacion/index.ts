// Reenvia a un especialista el correo para que establezca su contraseña.
//
// Hace falta porque las nueve cuentas del equipo ya existen: se crearon con una
// contraseña temporal que ahora esta retirada de la base. Nadie puede darles de
// alta otra vez — el correo ya esta ocupado — asi que la unica via es mandarles
// un enlace de recuperacion.
//
// Corre aqui y no en el navegador por lo de siempre: mandar el correo en nombre
// de otra persona exige la clave service_role. El cliente solo puede pedir
// recuperacion para SU propio correo.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Falta el token de sesión" }, 401);
  }

  const comoUsuario = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  // El token va explicito: getUser() sin argumento lee la sesion del
  // almacenamiento del cliente, y en una funcion edge no hay ninguno.
  const token = authHeader.slice("Bearer ".length);
  const { data: sesion, error: errSesion } = await comoUsuario.auth.getUser(token);
  if (errSesion || !sesion?.user) return json({ error: "Sesión inválida" }, 401);

  const { data: puede } = await comoUsuario.rpc("has_perm", { p: "user:manage" });
  if (puede !== true) {
    return json({ error: "No tienes permiso para enviar accesos" }, 403);
  }

  let cuerpo: { id?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const id = (cuerpo.id ?? "").trim();
  if (!id) return json({ error: "Falta el especialista" }, 400);

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  const { data: destino } = await admin
    .from("users").select("id, name, email, activo").eq("id", id).single();

  if (!destino) return json({ error: "No se encontró el especialista" }, 404);
  if (!destino.email) return json({ error: `${destino.name} no tiene correo registrado` }, 400);
  if (destino.activo === false) {
    // Mandar un acceso a alguien desactivado es contradictorio: entraria y no
    // podria hacer nada, o peor, si se reactiva despues nadie lo recuerda.
    return json({ error: `${destino.name} está desactivada. Actívala antes de enviarle el acceso.` }, 400);
  }

  const { error } = await admin.auth.resetPasswordForEmail(destino.email);

  if (error) {
    // El limite de envios de Supabase es bajo y devuelve 429. Sin decirlo, la
    // pantalla solo mostraria "no se pudo enviar" y nadie sabria que basta con
    // esperar.
    const limitado = (error.status === 429) || /rate|limit/i.test(error.message);
    return json({
      error: limitado
        ? "Se alcanzó el límite de correos por hora del servidor. Espera un rato o configura un SMTP propio."
        : `No se pudo enviar: ${error.message}`,
      limitado,
    }, limitado ? 429 : 500);
  }

  return json({
    ok: true,
    email: destino.email,
    aviso: `Se envió el acceso a ${destino.email}. El enlace caduca en 24 horas.`,
  });
});
