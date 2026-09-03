import React, { useState } from "react"
import { auth } from "./supabase.js"
import { T } from "./theme.js";

const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Ctext y='30' font-size='28' font-family='serif' fill='%23175FAF'%3EAIRA%3C/text%3E%3C/svg%3E"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Por favor ingresa tu email y contraseña.")
      return
    }
    setLoading(true)
    setError("")
    try {
      await auth.signIn(email.trim().toLowerCase(), password)
    } catch (err) {
      setError("Email o contraseña incorrectos. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#FFFBF2", fontFamily: T.font, padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontFamily: T.font, fontSize: 42, fontWeight: 500,
            color: "#175FAF", letterSpacing: "-0.02em", lineHeight: 1,
          }}>AIRA</div>
          <div style={{ fontSize: 13, color: "#8A9BAD", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Learning Hub
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #E8E4DA",
          padding: "36px 32px", boxShadow: "0 4px 24px rgba(21,47,54,0.07)",
        }}>
          <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color: "#1A2B3C", marginBottom: 6 }}>
            Bienvenida
          </div>
          <div style={{ fontSize: 13.5, color: "#8A9BAD", marginBottom: 28 }}>
            Ingresa con tu email y contraseña
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7B8D", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
                placeholder="tu@email.com"
                autoFocus
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: error ? "1.5px solid #E57373" : "1.5px solid #E8E4DA",
                  fontSize: 14.5, fontFamily: T.font, outline: "none",
                  color: "#1A2B3C", background: "#FAFAF8", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { if (!error) e.target.style.borderColor = "#175FAF" }}
                onBlur={(e) => { if (!error) e.target.style.borderColor = "#E8E4DA" }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7B8D", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError("") }}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "11px 44px 11px 14px", borderRadius: 12,
                    border: error ? "1.5px solid #E57373" : "1.5px solid #E8E4DA",
                    fontSize: 14.5, fontFamily: T.font, outline: "none",
                    color: "#1A2B3C", background: "#FAFAF8", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = "#175FAF" }}
                  onBlur={(e) => { if (!error) e.target.style.borderColor = "#E8E4DA" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#8A9BAD",
                    fontSize: 13, padding: "4px",
                  }}
                >
                  {showPw ? "ocultar" : "ver"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10,
                padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: 12, border: "none",
                background: loading ? "#8FA8C8" : "#175FAF", color: "#fff",
                fontSize: 15, fontWeight: 600, fontFamily: T.font,
                cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
              }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#B0B8C4", marginTop: 24 }}>
          Acceso protegido · datos confidenciales de pacientes
        </div>
      </div>
    </div>
  )
}
