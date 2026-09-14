import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { T, FONTS, inputStyle } from "./theme.js";
import { auth, supabase } from "./supabase.js";
import { Btn, Logo } from "./ui/index.js";
import { avisar } from "./store/avisosStore.js";
import { useDataStore } from "./store/dataStore.js";
import { useAuthStore } from "./store/authStore.js";
import { MINIMO, problemaConContrasena, fuerzaDeContrasena, mensajeDeGuardarContrasena } from "./lib/contrasena.js";

// Pantalla para establecer la contraseña, al llegar por un enlace de acceso.
//
// Faltaba. El enlace de recuperación traía a la persona a la aplicación con la
// sesión ya abierta, pero no había ningún sitio donde poner una contraseña: se
// entraba esa vez y a la siguiente ya no.
//
// SE ENSEÑA DE QUIÉN ES LA CUENTA, y es lo más importante de esta pantalla. El
// enlace no es una invitación: ES una autenticación. Quien lo abre queda dentro
// como esa persona, y si ya tenía sesión, la suya se sustituye. Pasó de verdad
// al probarlo: la administración copió el enlace de una especialista, lo abrió
// en su propio navegador y su sesión se convirtió en la de ella. Se leyó como
// "se me cerró la sesión", que es justo lo que no era.
// `motivo` decide qué pasa al terminar:
//
//   'enlace'    llegó por un enlace de acceso. Se cierra la sesión: el enlace
//               autentica a quien lo abre, y si lo probó la administración se
//               quedaría dentro como la especialista.
//   'temporal'  ya entró con su correo y una contraseña que le dio la
//               administración. Cerrarle la sesión que acaba de abrir sería
//               gratuito; se limpia la marca y sigue.
export default function EstablecerContrasena({ onListo, motivo = "enlace", usuario }) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);
  // Un solo interruptor para los dos campos: se escribe la misma contraseña
  // dos veces, y poder ver una y la otra no es de mucha ayuda.
  const [verClave, setVerClave] = useState(false);
  const [cuenta, setCuenta] = useState(null);
  const actualizarUsuario = useDataStore((s) => s.updateUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCuenta(data?.user?.email ?? null));
  }, []);

  const esTemporal = motivo === "temporal";

  const fuerza = fuerzaDeContrasena(clave);

  const salir = async () => {
    await auth.signOut();
    window.location.replace(window.location.pathname);
  };

  const guardar = async (e) => {
    e.preventDefault();
    const problema = problemaConContrasena(clave, repetida);
    if (problema) { avisar.error(problema); return; }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) {
      // En español y diciendo qué corregir. Antes el mensaje del servidor
      // llegaba tal cual —"Password should be at least 10 characters"— a una
      // pantalla que está entera en español, justo en el momento en que hace
      // falta entenderlo.
      const { titulo, detalle } = mensajeDeGuardarContrasena(error);
      avisar.error(titulo, detalle);
      setGuardando(false);
      return;
    }
    if (motivo === "temporal") {
      // La marca se limpia DESPUÉS de que la contraseña esté puesta. Al revés,
      // un fallo al guardar dejaría a la persona sin la obligación de cambiar
      // una clave que la administración conoce.
      try {
        await actualizarUsuario(usuario.id, { debeCambiarClave: false });
      } catch {
        // El store ya avisó. La contraseña quedó cambiada, que es lo que
        // importa; la marca se reintenta al siguiente inicio de sesión.
      }
      // Y en memoria. Sin esto la sesión abierta sigue marcada y esta misma
      // pantalla se vuelve a pintar: la persona queda encerrada en ella.
      setCurrentUser({ ...usuario, debeCambiarClave: false });
      onListo();
      return;
    }

    await auth.signOut();
    setHecho(true);
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.ink,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <style>{FONTS}</style>
      <div style={{
        width: "100%", maxWidth: 430, background: "#fff", borderRadius: 20,
        padding: "34px 32px", boxShadow: "0 18px 50px rgba(21,47,54,0.14)",
      }}>
        <div style={{ marginBottom: 22 }}><Logo /></div>

        {hecho ? (
          <>
            <Icono tono={T.logrado} fondo={T.logradoTint}><Check size={22} strokeWidth={3} /></Icono>
            <h1 style={titulo}>Contraseña guardada</h1>
            <p style={parrafo}>
              Ya puedes entrar con <strong style={{ color: T.ink }}>{cuenta}</strong> y tu
              contraseña nueva.
            </p>
            <Btn onClick={onListo}>Ir a entrar</Btn>
          </>
        ) : (
          <form onSubmit={guardar}>
            <Icono tono={T.brand} fondo={T.brandTint}><KeyRound size={20} /></Icono>
            <h1 style={titulo}>
              {esTemporal ? "Cambia tu contraseña" : "Crea tu contraseña"}
            </h1>

            {/* De quién es la cuenta, antes que nada. */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10, margin: "0 0 18px",
              padding: "11px 13px", borderRadius: 11,
              background: T.surfaceSunk, border: `1px solid ${T.border}`,
            }}>
              <AlertTriangle size={17} color={T.proceso} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5, minWidth: 0 }}>
                {esTemporal
                  ? "La que usaste la puso la administración del centro y ellos la conocen. Elige una tuya para seguir."
                  : <>Estás creando la contraseña de <strong style={{ wordBreak: "break-word" }}>{cuenta || "…"}</strong>.</>}
                <button
                  type="button" onClick={salir}
                  style={{
                    display: "block", marginTop: 4, background: "none", border: "none",
                    padding: 0, cursor: "pointer", fontFamily: T.font,
                    fontSize: 12.5, fontWeight: 600, color: T.brand, textDecoration: "underline",
                  }}
                >
                  {esTemporal ? "Salir" : "Esta no es mi cuenta — salir"}
                </button>
              </div>
            </div>

            <p style={parrafo}>
              Mínimo {MINIMO} caracteres. Una frase que recuerdes funciona mejor que algo
              corto y retorcido.
            </p>

            <Campo etiqueta="Contraseña nueva">
              <CampoClave
                value={clave} onChange={setClave} autoFocus
                visible={verClave} onAlternar={() => setVerClave((v) => !v)}
              />
            </Campo>

            {clave.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "-6px 0 14px" }}>
                <div style={{ flex: 1, height: 4, borderRadius: 999, background: T.surfaceSunk, overflow: "hidden" }}>
                  <div style={{
                    width: `${(fuerza.nivel / 3) * 100}%`, height: "100%", borderRadius: 999,
                    background: fuerza.nivel >= 3 ? T.logrado : fuerza.nivel === 2 ? T.proceso : T.apoyo,
                    transition: "width .15s ease",
                  }} />
                </div>
                <span style={{ fontSize: 11.5, color: T.inkFaint, minWidth: 66 }}>{fuerza.texto}</span>
              </div>
            )}

            <Campo etiqueta="Repítela">
              <CampoClave
                value={repetida} onChange={setRepetida}
                visible={verClave} onAlternar={() => setVerClave((v) => !v)}
              />
            </Campo>

            <Btn type="submit" disabled={guardando} style={{ width: "100%", marginTop: 6 }}>
              {guardando ? "Guardando…" : "Guardar contraseña"}
            </Btn>
          </form>
        )}
      </div>
    </div>
  );
}

const titulo = { fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 600, margin: "0 0 10px" };
const parrafo = { fontSize: 14, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 20px" };

function Icono({ tono, fondo, children }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 999, background: fondo, color: tono,
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint, marginBottom: 5,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {etiqueta}
      </div>
      {children}
    </div>
  );
}

// Campo de contraseña con ojito para verla.
//
// Se escribe una contraseña nueva a ciegas y además dos veces: sin poder
// mirarla, el error tipográfico solo aparece al final, como "las dos
// contraseñas no coinciden", sin decir cuál de las dos está mal.
function CampoClave({ value, onChange, visible, onAlternar, autoFocus }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        autoFocus={autoFocus}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box", paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={onAlternar}
        // Sin esto el lector de pantalla anuncia un botón sin nombre, y el
        // estado —visible u oculta— es justo lo que hace falta saber.
        aria-label={visible ? "Ocultar la contraseña" : "Ver la contraseña"}
        aria-pressed={visible}
        title={visible ? "Ocultar" : "Ver"}
        style={{
          position: "absolute", top: 0, bottom: 0, right: 0, width: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", padding: 0, cursor: "pointer",
          color: T.inkFaint,
        }}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
