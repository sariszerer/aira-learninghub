import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, ClipboardList, User, LogOut,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ShieldCheck,
} from "lucide-react";
import { T } from "../theme.js";
import { can, visibleChildren } from "../permissions.js";
import { useAuthStore } from "../store/authStore.js";
import { useDataStore } from "../store/dataStore.js";
import { auth } from "../supabase.js";
import { Avatar, Logo } from "../ui/index.js";

// Navegacion de dos carriles: un riel de iconos siempre visible y un panel que
// se pliega. Plegado deja 60px y el area de trabajo gana 240.
//
// Cada entrada declara el permiso que la habilita, y solo se listan destinos
// que existen: un menu con enlaces muertos promete secciones que redirigen al
// inicio sin explicacion.
const RIEL = 60;
const PANEL = 240;

export default function Sidebar({ abierto, onAlternar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const children = useDataStore((s) => s.children);

  const [grupoAbierto, setGrupoAbierto] = useState(true);

  // Los contadores salen del alcance real del usuario, no del total: a un
  // especialista no le sirve saber cuantos pacientes tiene la clinica.
  const conteos = useMemo(() => {
    const mios = visibleChildren(currentUser, children);
    return {
      total: mios.length,
      activos: mios.filter((c) => c.status !== "inactivo").length,
      inactivos: mios.filter((c) => c.status === "inactivo").length,
    };
  }, [currentUser, children]);

  const items = [
    { to: "/", label: "Inicio", icon: LayoutGrid },
    {
      to: "/pacientes", label: "Pacientes", icon: Users, permiso: "patient:view",
      cuenta: conteos.total,
      hijos: [
        { to: "/pacientes?estado=activo", label: "Activos", cuenta: conteos.activos },
        { to: "/pacientes?estado=inactivo", label: "Inactivos", cuenta: conteos.inactivos },
      ],
    },
    { to: "/gabinete", label: "Gabinete", icon: ClipboardList, permiso: "gabinete:view" },
    { to: "/especialistas", label: "Especialistas", icon: User, permiso: "user:manage" },
    { to: "/roles", label: "Roles", icon: ShieldCheck, permiso: "role:manage" },
  ].filter((i) => !i.permiso || can(currentUser, i.permiso));

  const rutaActual = location.pathname + location.search;
  const activo = (to) => {
    if (to === "/") return location.pathname === "/";
    if (to.includes("?")) return rutaActual === to;
    return location.pathname.startsWith(to.split("?")[0]) && !location.search;
  };

  const salir = async () => { await auth.signOut(); setCurrentUser(null); navigate("/"); };

  const Badge = ({ n }) => (
    <span style={{
      marginLeft: "auto", fontSize: 11, fontWeight: 600, lineHeight: 1,
      background: T.ink, color: "#fff", borderRadius: 6, padding: "3px 6px", minWidth: 18,
      textAlign: "center",
    }}>
      {n}
    </span>
  );

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
      display: "flex", width: abierto ? RIEL + PANEL : RIEL,
      transition: "width .18s ease",
    }}>
      {/* Riel: siempre visible, solo iconos */}
      <div style={{
        width: RIEL, background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0", gap: 4,
      }}>
        <div style={{ marginBottom: 12 }}><Logo width={40} /></div>

        {items.map((it) => {
          const on = activo(it.to) || location.pathname.startsWith(it.to.split("?")[0]) && it.to !== "/";
          const Icon = it.icon;
          return (
            <button
              key={it.to}
              onClick={() => navigate(it.to)}
              title={it.label}
              aria-label={it.label}
              style={{
                width: 36, height: 36, borderRadius: T.radiusSm, border: "none",
                display: "grid", placeItems: "center", cursor: "pointer",
                background: on ? T.surfaceSunk : "transparent",
                color: on ? T.ink : T.inkFaint,
              }}
            >
              <Icon size={19} strokeWidth={1.9} />
            </button>
          );
        })}

        <button
          onClick={onAlternar}
          title={abierto ? "Plegar menú" : "Desplegar menú"}
          aria-label={abierto ? "Plegar menú" : "Desplegar menú"}
          style={{
            marginTop: "auto", width: 36, height: 36, borderRadius: T.radiusSm,
            border: "none", background: "transparent", color: T.inkFaint,
            display: "grid", placeItems: "center", cursor: "pointer",
          }}
        >
          {abierto ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>

      {/* Panel: se pliega */}
      {abierto && (
        <div style={{
          width: PANEL, background: T.bg, borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
              AIRA Learning Hub
            </div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
              Panamá · {conteos.total} paciente{conteos.total === 1 ? "" : "s"}
            </div>
          </div>

          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
            {items.map((it) => {
              const on = activo(it.to);
              const Icon = it.icon;
              return (
                <div key={it.to}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => navigate(it.to)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", marginBottom: 2, borderRadius: T.radiusSm,
                        border: "none", cursor: "pointer", textAlign: "left",
                        fontFamily: T.font, fontSize: 13.5,
                        fontWeight: on ? 600 : 500,
                        color: on ? T.ink : T.inkSoft,
                        background: on ? T.surface : "transparent",
                        boxShadow: on ? T.shadow : "none",
                      }}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      {it.label}
                      {it.cuenta != null && !it.hijos && <Badge n={it.cuenta} />}
                    </button>

                    {it.hijos && (
                      <button
                        onClick={() => setGrupoAbierto((g) => !g)}
                        title={grupoAbierto ? "Contraer" : "Expandir"}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: T.inkFaint, padding: 4, display: "grid", placeItems: "center",
                        }}
                      >
                        <ChevronDown
                          size={15}
                          style={{
                            transform: grupoAbierto ? "none" : "rotate(-90deg)",
                            transition: "transform .15s ease",
                          }}
                        />
                      </button>
                    )}
                  </div>

                  {it.hijos && grupoAbierto && it.hijos.map((h) => {
                    const hOn = activo(h.to);
                    return (
                      <button
                        key={h.to}
                        onClick={() => navigate(h.to)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          padding: "6px 10px 6px 37px", marginBottom: 2,
                          borderRadius: T.radiusSm, border: "none", cursor: "pointer",
                          textAlign: "left", fontFamily: T.font, fontSize: 13,
                          fontWeight: hOn ? 600 : 500,
                          color: hOn ? T.ink : T.inkSoft,
                          background: hOn ? T.surface : "transparent",
                          boxShadow: hOn ? T.shadow : "none",
                        }}
                      >
                        {h.label}
                        <Badge n={h.cuenta} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div style={{ padding: 10, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px" }}>
              <Avatar name={currentUser?.name || "?"} bg={currentUser?.avatarBg || T.brand} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 600, color: T.ink,
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
                onClick={salir}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: T.inkFaint, display: "grid", placeItems: "center", padding: 4,
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export { RIEL, PANEL };
