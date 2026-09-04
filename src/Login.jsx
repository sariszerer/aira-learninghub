import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { auth } from "./supabase.js";
import { T } from "./theme.js";
import { Btn, Logo } from "./ui/index.js";

// Pantalla de acceso. Antes traia quince colores del tema anterior escritos a
// mano y un logotipo SVG propio en el azul viejo; ahora sale todo de los tokens
// y del mismo logotipo que usa la barra lateral.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verPw, setVerPw] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await auth.signIn(email.trim().toLowerCase(), password);
    } catch {
      // Mismo mensaje para correo inexistente y contraseña incorrecta: decir
      // cual de los dos falla le confirma a quien sondea que esa cuenta existe.
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const estiloCampo = {
    width: "100%", padding: "10px 13px", borderRadius: T.radiusSm,
    border: `1px solid ${error ? T.apoyo : T.border}`,
    fontSize: 14, fontFamily: T.font, outline: "none",
    color: T.ink, background: T.surface, boxSizing: "border-box",
    transition: "border-color .15s ease",
  };

  const etiqueta = {
    display: "block", fontSize: 11.5, fontWeight: 600, color: T.inkSoft,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const enfocar = (e) => { if (!error) e.target.style.borderColor = T.brand; };
  const desenfocar = (e) => { if (!error) e.target.style.borderColor = T.border; };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.bg, fontFamily: T.font, padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <Logo size={38} />
        </div>

        <div style={{
          background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
          padding: "30px 28px", boxShadow: T.shadowLift,
        }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em" }}>
            Bienvenida
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4, marginBottom: 24 }}>
            Ingresa con tu correo y contraseña
          </div>

          <form onSubmit={enviar}>
            <div style={{ marginBottom: 15 }}>
              <label style={etiqueta}>Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="tu@correo.com"
                autoFocus
                style={estiloCampo}
                onFocus={enfocar}
                onBlur={desenfocar}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={etiqueta}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={verPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  style={{ ...estiloCampo, paddingRight: 42 }}
                  onFocus={enfocar}
                  onBlur={desenfocar}
                />
                <button
                  type="button"
                  onClick={() => setVerPw((v) => !v)}
                  title={verPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-label={verPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: T.inkFaint, display: "grid", placeItems: "center", padding: 4,
                  }}
                >
                  {verPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: T.apoyoTint, border: `1px solid ${T.apoyo}33`,
                borderRadius: T.radiusSm, padding: "9px 12px",
                fontSize: 13, color: T.apoyo, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <Btn type="submit" size="lg" full disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </Btn>
          </form>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 11.5, color: T.inkFaint, marginTop: 20,
        }}>
          <ShieldCheck size={13} />
          Acceso protegido · datos confidenciales de pacientes
        </div>
      </div>
    </div>
  );
}
