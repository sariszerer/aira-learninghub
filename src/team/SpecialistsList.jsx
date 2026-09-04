import React, { useState, useMemo } from "react";
import { Plus, Check, X } from "lucide-react";
import { T } from "../theme.js";
import { ROLES } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import PageHeader from "../shell/PageHeader.jsx";
import SpecialistModal from "./SpecialistModal.jsx";
import { Avatar, Btn, Card, IconBtn, List, ListRow, Table } from "../ui/index.js";

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

      <div style={{ padding: "24px 28px 48px" }}>
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

        <Table
          columnas={[
            {
              clave: "name", titulo: "Especialista", ancho: "1.8fr",
              celda: (u) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={u.name} bg={u.avatarBg || T.brand} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.inkFaint }}>
                      {u.email || "sin correo"}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              clave: "role", titulo: "Rol", ancho: "130px",
              valor: (u) => ROLES[u.role]?.etiqueta || u.role,
              celda: (u) => (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: T.brand, background: T.brandTint,
                  borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap",
                }}>
                  {ROLES[u.role]?.etiqueta || u.role}
                </span>
              ),
            },
            {
              clave: "specialty", titulo: "Especialidad", ancho: "1.4fr",
              celda: (u) => (
                <span style={{ color: T.inkSoft, fontSize: 12.5 }}>
                  {u.specialty || u.title || "—"}
                </span>
              ),
            },
            {
              clave: "pacientes", titulo: "Pacientes", ancho: "100px", alinear: "derecha",
              celda: (u) => <span style={{ fontWeight: 600 }}>{u.pacientes}</span>,
            },
            {
              clave: "sesiones", titulo: "Sesiones", ancho: "100px", alinear: "derecha",
              celda: (u) => <span style={{ color: T.inkSoft }}>{u.sesiones}</span>,
            },
            {
              clave: "acciones", titulo: "", ancho: "130px", alinear: "derecha", ordenable: false,
              celda: (u) => puedeGestionar ? (
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn variant="secondary" size="sm" onClick={() => setEditando(u)}>Editar</Btn>
                  <IconBtn
                    icon={u.activo === false ? Check : X}
                    title={u.activo === false ? "Reactivar" : "Desactivar"}
                    tone={u.activo === false ? "marca" : "neutro"}
                    size="sm"
                    onClick={() => alternarActivo(u)}
                  />
                </div>
              ) : null,
            },
          ]}
          filas={equipo.map((u) => ({ ...u, ...carga(u.id) }))}
          ordenInicial={{ clave: "name", dir: "asc" }}
          vacio="Ningún especialista coincide con la búsqueda."
        />

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
