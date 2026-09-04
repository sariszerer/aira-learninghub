// Alta de especialista con acceso real.
//
// Crear un usuario que pueda iniciar sesion exige la clave service_role, y esa
// clave no puede vivir en el navegador: quien la tenga puede leer y escribir
// toda la base saltandose RLS. Por eso este paso corre aqui y no en el cliente.
//
// La funcion hace tres cosas, en este orden:
//   1. verifica QUIEN llama, con su propio token, y que sea admin
//   2. crea el usuario de auth con service_role
//   3. crea la fila de public.users que lo liga al perfil
//
// Si el paso 3 falla, el paso 2 se deshace: un usuario de auth sin perfil no
// puede entrar pero ocupa el correo, y bloquearia reintentar el alta.

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

  // ── 1. Quien llama ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Falta el token de sesión" }, 401);
  }

  // Cliente con el token de quien llama: RLS aplica igual que en el navegador.
  const comoUsuario = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: sesion, error: errSesion } = await comoUsuario.auth.getUser();
  if (errSesion || !sesion?.user) {
    return json({ error: "Sesión inválida" }, 401);
  }

  const { data: perfil } = await comoUsuario
    .from("users")
    .select("id, role")
    .eq("auth_id", sesion.user.id)
    .single();

  if (!perfil || perfil.role !== "admin") {
    // Mismo mensaje para "no eres admin" y "no tienes perfil": no hace falta
    // decirle a quien sondea cual de las dos cosas le falta.
    return json({ error: "No tienes permiso para dar de alta especialistas" }, 403);
  }

  // ── 2. Datos de entrada ───────────────────────────────────────────────────
  let cuerpo: Record<string, string>;
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const email = (cuerpo.email ?? "").trim().toLowerCase();
  const nombre = (cuerpo.name ?? "").trim();
  const rol = (cuerpo.role ?? "specialist").trim();

  if (!email || !nombre) {
    return json({ error: "El nombre y el correo son obligatorios" }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "El correo no tiene un formato válido" }, 400);
  }
  if (!["specialist", "clinical_director", "admin", "shadow"].includes(rol)) {
    return json({ error: "Rol no reconocido" }, 400);
  }

  const admin = createClient(URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 3. Usuario de auth ────────────────────────────────────────────────────
  // Contraseña temporal aleatoria: la persona la cambia al entrar. No se
  // devuelve al cliente para que no acabe en un log del navegador.
  const temporal = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);

  const { data: creado, error: errCrear } = await admin.auth.admin.createUser({
    email,
    password: temporal,
    email_confirm: true,
    user_metadata: { name: nombre },
  });

  if (errCrear || !creado?.user) {
    const yaExiste = (errCrear?.message ?? "").toLowerCase().includes("already");
    return json(
      { error: yaExiste ? "Ya existe una cuenta con ese correo" : "No se pudo crear la cuenta" },
      yaExiste ? 409 : 500,
    );
  }

  // ── 4. Fila de perfil ─────────────────────────────────────────────────────
  const id = cuerpo.id?.trim() || `u-${nombre.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 24)}-${Date.now().toString(36).slice(-4)}`;

  const { error: errPerfil } = await admin.from("users").insert({
    id,
    name: nombre,
    email,
    role: rol,
    specialty: cuerpo.specialty ?? null,
    title: cuerpo.title ?? null,
    license_no: cuerpo.licenseNo ?? null,
    avatar_bg: cuerpo.avatarBg ?? null,
    auth_id: creado.user.id,
    activo: true,
  });

  if (errPerfil) {
    // Deshacer el paso anterior: sin esto queda un usuario de auth sin perfil
    // que ocupa el correo y bloquea reintentar el alta.
    await admin.auth.admin.deleteUser(creado.user.id);
    return json({ error: "No se pudo crear el perfil: " + errPerfil.message }, 500);
  }

  // ── 5. Invitacion ─────────────────────────────────────────────────────────
  // Enlace de recuperacion para que la persona fije su propia contraseña. Si
  // el correo no sale, el alta ya es valida: se informa y no se revierte.
  const { error: errCorreo } = await admin.auth.resetPasswordForEmail(email);

  return json({
    ok: true,
    id,
    invitacionEnviada: !errCorreo,
    aviso: errCorreo ? "La cuenta se creó, pero no se pudo enviar el correo de invitación." : null,
  });
});
