import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, ClipboardList, FileText, TrendingUp,
  Calendar, LogOut, User,
} from "lucide-react";
import { T } from "../theme.js";
import { can } from "../permissions.js";
import { useAuthStore } from "../store/authStore.js";
import { auth } from "../supabase.js";
import { Avatar, Logo } from "../ui/index.js";

// Navegacion lateral fija. Sustituye a la barra superior: con nueve secciones y
// dos grupos, en horizontal no cabian sin recortar etiquetas.
//
// Cada entrada declara el permiso que la habilita, asi que un rol nuevo creado
// desde la fase 4 de roles obtiene su navegacion sin tocar este archivo.
// Solo se listan destinos que existen. Un menu con enlaces muertos es peor que
// uno corto: promete secciones que redirigen al inicio sin explicacion.
const SECCIONES = [
  {
    titulo: "General",
    items: [
      { to: "/",          label: "Inicio",    icon: LayoutGrid },
      { to: "/pacientes", label: "Pacientes", icon: Users, permiso: "patient:view" },
      { to: "/gabinete",  label: "Gabinete",  icon: ClipboardList, permiso: "gabinete:view" },
      { to: "/especialistas", label: "Especialistas", icon: User, permiso: "user:manage" },
    ],
  },
];

const ANCHO = 236;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  const activo = (to) => to === "/"
    ? location.pathname === "/"
    : location.pathname.startsWith(to);

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: ANCHO,
      background: T.surface, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 20,
    }}>
      <div style={{
        padding: "20px 18px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${T.borderSoft}`,
      }}>
        {/* El logotipo ya incluye la palabra AIRA: repetirla al lado la duplica. */}
        <Logo size={28} />
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {SECCIONES.map((seccion) => (
          <div key={seccion.titulo} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: T.inkFaint, letterSpacing: "0.07em",
              textTransform: "uppercase", padding: "0 10px", marginBottom: 8,
            }}>
              {seccion.titulo}
            </div>
            {seccion.items
              .filter((it) => !it.permiso || can(currentUser, it.permiso))
              .map((it) => {
                const on = activo(it.to);
                const Icon = it.icon;
                return (
                  <button
                    key={it.to}
                    onClick={() => navigate(it.to)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", marginBottom: 2, borderRadius: T.radiusSm,
                      border: "none", cursor: "pointer", textAlign: "left",
                      fontFamily: T.font, fontSize: 13.5,
                      fontWeight: on ? 600 : 500,
                      color: on ? T.brand : T.inkSoft,
                      background: on ? T.brandTint : "transparent",
                    }}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {it.label}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: `1px solid ${T.borderSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
          <Avatar name={currentUser?.name || "?"} bg={currentUser?.color || T.brand} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: T.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {currentUser?.name}
            </div>
            <div style={{
              fontSize: 11.5, color: T.inkFaint,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {currentUser?.etiqueta}
            </div>
          </div>
          <button
            onClick={async () => { await auth.signOut(); setCurrentUser(null); navigate("/"); }}
            title="Cerrar sesión"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.inkFaint, display: "grid", placeItems: "center", padding: 4,
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { ANCHO as ANCHO_SIDEBAR };
