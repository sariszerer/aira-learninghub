import React, { useState, useMemo } from "react";
import { Plus, Check, X } from "lucide-react";
import { T } from "../theme.js";
import { ROLES } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import PageHeader from "../shell/PageHeader.jsx";
import SpecialistModal from "./SpecialistModal.jsx";
import { Avatar, Btn, IconBtn } from "../ui/index.js";

// Gestion del equipo. El alta pasa por una Edge Function porque crear un
// usuario que pueda iniciar sesion exige service_role; editar y desactivar si
// van directo contra la tabla, con las politicas RLS que las habilitan.
//
// Nunca se borra a nadie: un especialista figura en sesiones y objetivos
// historicos, y eliminarlo dejaria huerfano el expediente. Se desactiva.
export default function SpecialistsList() {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const children = useDataStore((s) => s.children);
  const updateUser = useDataStore((s) => s.updateUser);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [query, setQuery] = useState("");
  const [verInactivos, setVerInactivos] = useState(false);
  const [editando, setEditando] = useState(null);   // objeto usuario, o "nuevo"
  const [error, setError] = useState(null);

  const puedeGestionar = currentUser?.permissions?.has("user:manage");

  const equipo = useMemo(() => users
    .filter((u) => ROLES[u.role]?.esClinico || u.role === "admin")
    .filter((u) => verInactivos || u.activo !== false)
    .filter((u) => `${u.name} ${u.specialty || ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name)),
    [users, query, verInactivos]);

  const inactivos = users.filter((u) => u.activo === false).length;

  const carga = (id) => ({
    pacientes: children.filter((c) => c.assignedSpecialists?.includes(id)).length,
    sesiones: sessions.filter((s) => s.specialistId === id).length,
  });

  const alternarActivo = async (u) => {
    setError(null);
    try {
      await updateUser(u.id, { activo: u.activo === false });
    } catch (e) {
      setError(e.message || "No se pudo guardar el cambio.");
    }
  };

  return (
    <>
      <PageHeader
        titulo="Especialistas"
        subtitulo={`${equipo.length} en el equipo${inactivos ? ` · ${inactivos} inactivo${inactivos > 1 ? "s" : ""}` : ""}`}
        buscar={query}
        onBuscar={setQuery}
        acciones={puedeGestionar && (
          <Btn variant="primary" size="sm" onClick={() => setEditando("nuevo")} icon={Plus}>Nuevo especialista</Btn>
        )}
      />

      <div style={{ padding: "20px 28px 48px" }}>
        {error && (
          <div style={{
            background: T.apoyoTint, color: T.apoyo, border: `1px solid ${T.apoyo}33`,
            borderRadius: T.radiusSm, padding: "10px 14px", fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {inactivos > 0 && (
          <button
            onClick={() => setVerInactivos((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: T.font, fontSize: 12.5, color: T.brand,
              fontWeight: 500, marginBottom: 14,
            }}
          >
            {verInactivos ? "Ocultar inactivos" : `Ver ${inactivos} inactivo${inactivos > 1 ? "s" : ""}`}
          </button>
        )}

        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: T.radius, boxShadow: T.shadow, overflow: "hidden",
        }}>
          {equipo.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: T.inkFaint, fontSize: 14 }}>
              Ningún especialista coincide con la búsqueda.
            </div>
          ) : equipo.map((u, i) => {
            const { pacientes, sesiones } = carga(u.id);
            const inactivo = u.activo === false;
            return (
              <div
                key={u.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                  borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none",
                  opacity: inactivo ? 0.55 : 1,
                }}
              >
                <Avatar name={u.name} bg={u.avatarBg || T.brand} size={36} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{u.name}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, color: T.brand, background: T.brandTint,
                      borderRadius: 999, padding: "1px 8px",
                    }}>
                      {ROLES[u.role]?.etiqueta || u.role}
                    </span>
                    {inactivo && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, color: T.inkSoft,
                        background: T.surfaceSunk, borderRadius: 999, padding: "1px 8px",
                      }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
                    {u.specialty || u.title || "Sin especialidad"} · {u.email || "sin correo"}
                  </div>
                </div>

                <div style={{ textAlign: "right", fontSize: 12, color: T.inkSoft, minWidth: 110 }}>
                  <div>{pacientes} paciente{pacientes === 1 ? "" : "s"}</div>
                  <div style={{ color: T.inkFaint }}>{sesiones} sesion{sesiones === 1 ? "" : "es"}</div>
                </div>

                {puedeGestionar && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="secondary" size="sm" onClick={() => setEditando(u)}>Editar</Btn>
                    <IconBtn
                      icon={inactivo ? Check : X}
                      title={inactivo ? "Reactivar" : "Desactivar"}
                      tone={inactivo ? "marca" : "neutro"}
                      size="sm"
                      onClick={() => alternarActivo(u)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 12, lineHeight: 1.5 }}>
          Desactivar conserva el historial: las sesiones y objetivos que registró
          siguen atribuidos a esa persona. Solo deja de aparecer en los selectores
          y no puede iniciar sesión.
        </div>
      </div>

      {editando && (
        <SpecialistModal
          usuario={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}
