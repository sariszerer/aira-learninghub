import React, { useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { T, FONTS, inputStyle } from "./theme.js";
import { supabase } from "./supabase.js";
import { Btn, Logo } from "./ui/index.js";
import { avisar } from "./store/avisosStore.js";
import { MINIMO, problemaConContrasena, fuerzaDeContrasena } from "./lib/contrasena.js";

// Pantalla para establecer la contraseña, al llegar por un enlace de acceso.
//
// Faltaba. El enlace de recuperación traía a la persona a la aplicación con la
// sesión ya abierta, pero no había ningún sitio donde poner una contraseña: se
// entraba esa vez y a la siguiente ya no, porque nadie tenía una que escribir.
// Los accesos enviados hasta ahora eran un callejón sin salida.
export default function EstablecerContrasena({ onListo }) {
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const fuerza = fuerzaDeContrasena(clave);

  const guardar = async (e) => {
    e.preventDefault();
    const problema = problemaConContrasena(clave, repetida);
    if (problema) { avisar.error(problema); return; }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) {
      // El enlace caduca. Decirlo evita que la persona pruebe tres veces
      // pensando que se equivoca al escribir.
      const caducado = /expired|invalid|not found/i.test(error.message);
      avisar.error(
        caducado ? "El enlace ya caducó" : "No se pudo guardar la contraseña",
        caducado
          ? "Pide uno nuevo a la administración del centro."
          : error.message
      );
      setGuardando(false);
      return;
    }
    setHecho(true);
    // Se limpia el fragmento para que recargar no vuelva a esta pantalla.
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.ink,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <style>{FONTS}</style>
      <div style={{
        width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20,
        padding: "34px 32px", boxShadow: "0 18px 50px rgba(21,47,54,0.14)",
      }}>
        <div style={{ marginBottom: 22 }}><Logo /></div>

        {hecho ? (
          <>
            <div style={{
              width: 44, height: 44, borderRadius: 999, background: T.logradoTint,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Check size={22} color={T.logrado} strokeWidth={3} />
            </div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 600, margin: "0 0 6px" }}>
              Contraseña guardada
            </h1>
            <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 20px" }}>
              A partir de ahora entras con tu correo y esta contraseña.
            </p>
            <Btn onClick={onListo}>Entrar</Btn>
          </>
        ) : (
          <form onSubmit={guardar}>
            <div style={{
              width: 44, height: 44, borderRadius: 999, background: T.brandTint,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <KeyRound size={20} color={T.brand} />
            </div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 600, margin: "0 0 6px" }}>
              Crea tu contraseña
            </h1>
            <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 20px" }}>
              Es la que usarás para entrar a partir de ahora. Mínimo {MINIMO} caracteres —
              una frase que recuerdes funciona mejor que algo corto y retorcido.
            </p>

            <Campo etiqueta="Contraseña nueva">
              <input
                type="password" value={clave} autoFocus autoComplete="new-password"
                onChange={(e) => setClave(e.target.value)}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
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
              <input
                type="password" value={repetida} autoComplete="new-password"
                onChange={(e) => setRepetida(e.target.value)}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
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
