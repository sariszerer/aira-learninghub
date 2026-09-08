// Genera las plantillas de correo de Supabase a partir de una sola base.
//
// Se generan en vez de escribirse a mano por la misma razon que la siembra de
// roles: hay cuatro correos y comparten cabecera, boton y pie. Escritos aparte
// divergen a la primera correccion, y en un correo eso no se ve hasta que ya
// salio.
//
//   node scripts/generar-plantillas-correo.mjs          -> escribe los .html
//   node scripts/generar-plantillas-correo.mjs --json   -> cuerpo para la API
//
// Los marcadores {{ .ConfirmationURL }} y {{ .Email }} los rellena Supabase al
// enviar; no se tocan.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR = join(AQUI, "..", "supabase", "plantillas-correo");
const base = readFileSync(join(DIR, "base.html"), "utf8");

// El logo se sirve desde la aplicacion. En un correo no puede ir embebido como
// data URI: Gmail y Outlook descartan las imagenes en base64.
const LOGO = "https://aira-learninghub.vercel.app/aira-logo.png";

const boton = (texto) => `
            <tr>
              <td align="center" style="padding:22px 32px 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#1E79E2" style="border-radius:10px;">
                      <a href="{{ .ConfirmationURL }}"
                         style="display:inline-block; padding:13px 30px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">
                        ${texto}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 32px 0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11.5px; line-height:1.5; color:#9CA3AF;">
                Si el botón no funciona, copia este enlace en tu navegador:<br />
                <span style="color:#1560B8; word-break:break-all;">{{ .ConfirmationURL }}</span>
              </td>
            </tr>`;

// El aviso de caducidad va en todas: sin el, quien abre el correo dos dias
// despues cree que el sistema esta roto en vez de pedir otro enlace.
const CADUCA = "Este enlace caduca en 24 horas y solo se puede usar una vez. Si ya venció, pide uno nuevo a la administración.";

const PLANTILLAS = {
  invite: {
    archivo: "invitacion.html",
    asunto: "Tu acceso a AIRA Learning Hub",
    previo: "Crea tu contraseña para entrar a AIRA.",
    titulo: "Te damos acceso a AIRA Learning Hub",
    cuerpo: `<p style="margin:0 0 12px;">Hola,</p>
                <p style="margin:0 0 12px;">Ya tienes cuenta en <strong>AIRA Learning Hub</strong>, el sistema donde llevamos los expedientes, las sesiones y los reportes de los pacientes.</p>
                <p style="margin:0;">Solo falta que crees tu contraseña.</p>`,
    accion: boton("Crear mi contraseña"),
    pie: `Entrarás con <strong style="color:#374151;">{{ .Email }}</strong>. ${CADUCA}`,
  },

  recovery: {
    archivo: "recuperar.html",
    asunto: "Crea tu contraseña de AIRA",
    previo: "Enlace para establecer tu contraseña.",
    titulo: "Crea tu contraseña",
    cuerpo: `<p style="margin:0 0 12px;">Hola,</p>
                <p style="margin:0;">Desde AIRA se solicitó un enlace para que establezcas la contraseña de tu cuenta. Elige una que solo tú conozcas.</p>`,
    accion: boton("Establecer contraseña"),
    pie: `Es para la cuenta <strong style="color:#374151;">{{ .Email }}</strong>. ${CADUCA}<br /><br />Si no esperabas este correo, puedes ignorarlo: tu contraseña actual sigue funcionando.`,
  },

  confirmation: {
    archivo: "confirmacion.html",
    asunto: "Confirma tu correo en AIRA",
    previo: "Confirma tu dirección para activar el acceso.",
    titulo: "Confirma tu correo",
    cuerpo: `<p style="margin:0;">Confirma que <strong>{{ .Email }}</strong> es tu dirección para activar el acceso a AIRA Learning Hub.</p>`,
    accion: boton("Confirmar mi correo"),
    pie: CADUCA,
  },

  email_change: {
    archivo: "cambio-correo.html",
    asunto: "Confirma tu nuevo correo en AIRA",
    previo: "Confirma la nueva dirección de tu cuenta.",
    titulo: "Confirma tu nuevo correo",
    cuerpo: `<p style="margin:0 0 12px;">Se cambió la dirección de tu cuenta de AIRA a <strong>{{ .Email }}</strong>.</p>
                <p style="margin:0;">Confírmala para seguir entrando con ella.</p>`,
    accion: boton("Confirmar el cambio"),
    pie: `${CADUCA}<br /><br />Si no pediste este cambio, avisa a la administración de AIRA cuanto antes.`,
  },
};

function componer(p) {
  // El comentario de cabecera de base.html NOMBRA los marcadores, y un replace
  // con cadena sustituye solo la primera aparicion: los reemplazos caian dentro
  // del comentario y los marcadores de verdad se quedaban en el correo. Se
  // quita el comentario primero — no pinta nada en un correo — y los reemplazos
  // van con expresion global.
  const sinComentario = base.replace(/^<!--[\s\S]*?-->\s*/, "");
  const pon = (txt, marcador, valor) =>
    txt.replace(new RegExp(`\{\{${marcador}\}\}`, "g"), () => valor);

  let html = sinComentario;
  for (const [marcador, valor] of [
    ["TITULO", p.titulo], ["PREVIO", p.previo], ["CUERPO", p.cuerpo],
    ["ACCION", p.accion], ["PIE", p.pie], ["LOGO", LOGO],
  ]) {
    html = pon(html, marcador, valor);
  }
  if (/\{\{[A-Z]/.test(html)) {
    throw new Error(`Quedan marcadores sin sustituir en ${p.archivo}`);
  }
  return html;
}

const generadas = Object.fromEntries(
  Object.entries(PLANTILLAS).map(([clave, p]) => [clave, { ...p, html: componer(p) }])
);

if (process.argv.includes("--json")) {
  // Cuerpo listo para PATCH /v1/projects/<ref>/config/auth
  const cuerpo = {};
  for (const [clave, p] of Object.entries(generadas)) {
    cuerpo[`mailer_subjects_${clave}`] = p.asunto;
    cuerpo[`mailer_templates_${clave}_content`] = p.html;
  }
  process.stdout.write(JSON.stringify(cuerpo));
} else {
  mkdirSync(DIR, { recursive: true });
  for (const [clave, p] of Object.entries(generadas)) {
    writeFileSync(join(DIR, p.archivo), p.html);
    console.log(`${p.archivo.padEnd(20)} ${clave.padEnd(14)} ${p.html.length} bytes`);
  }
}
