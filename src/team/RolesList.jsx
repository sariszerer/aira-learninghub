import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Trash2, Lock } from "lucide-react";
import { T } from "../theme.js";
import { PERMISSIONS } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, IconBtn, Table } from "../ui/index.js";
import PageHeader from "../shell/PageHeader.jsx";

const SCOPE_LABEL = {
  todos: "Todos los pacientes",
  asignados: "Solo los asignados",
  un_nino: "Un solo niño",
};

export default function RolesList() {
  const navigate = useNavigate();
  const roles = useDataStore((s) => s.rolesDisponibles);
  const users = useDataStore((s) => s.users);
  const cargarRoles = useDataStore((s) => s.cargarRoles);
  const guardarRol = useDataStore((s) => s.guardarRol);
  const borrarRol = useDataStore((s) => s.borrarRol);

  const [error, setError] = useState(null);

  useEffect(() => { cargarRoles().catch((e) => setError(e.message)); }, [cargarRoles]);

  const filas = useMemo(() => roles.map((r) => ({
    ...r,
    personas: users.filter((u) => u.role === r.id).length,
    nPermisos: r.permisos.length,
  })), [roles, users]);

  // Duplicar es como se crea un rol en la practica: partir de Especialista y
  // quitar dos casillas, en vez de marcar veintiuna desde cero.
  const duplicar = async (r) => {
    setError(null);
    const base = `${r.id}-copia`;
    let id = base, n = 2;
    while (roles.some((x) => x.id === id)) id = `${base}-${n++}`;
    try {
      await guardarRol({ ...r, id, nombre: `${r.nombre} (copia)`, esSistema: false }, true);
      navigate(`/roles/${id}`);
    } catch (e) { setError(e.message || "No se pudo duplicar."); }
  };

  const borrar = async (r) => {
    setError(null);
    try { await borrarRol(r.id); }
    catch (e) { setError(e.message || "No se pudo borrar."); }
  };

  const columnas = [
    {
      clave: "nombre", titulo: "Rol", ancho: "1.6fr",
      celda: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{
            width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
            background: r.color || T.brand,
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {r.nombre}
              {r.esSistema && <Lock size={12} color={T.inkFaint} />}
            </div>
            <div style={{ fontSize: 11.5, color: T.inkFaint }}>{r.etiqueta}</div>
          </div>
        </div>
      ),
    },
    {
      clave: "scope", titulo: "Alcance", ancho: "1.2fr",
      celda: (r) => <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{SCOPE_LABEL[r.scope] || r.scope}</span>,
    },
    {
      clave: "nPermisos", titulo: "Permisos", ancho: "110px", alinear: "derecha",
      celda: (r) => (
        <span style={{ fontWeight: 600 }}>{r.nPermisos}
          <span style={{ color: T.inkFaint, fontWeight: 400 }}> / {PERMISSIONS.length}</span>
        </span>
      ),
    },
    {
      clave: "personas", titulo: "Personas", ancho: "100px", alinear: "derecha",
      // El contador convierte editar un rol en decision informada: cambiar el
      // alcance de uno con seis personas no es lo mismo que de uno vacio.
      celda: (r) => <span style={{ fontWeight: 600 }}>{r.personas}</span>,
    },
    {
      clave: "acciones", titulo: "", ancho: "150px", alinear: "derecha", ordenable: false,
      celda: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Btn variant="secondary" size="sm" onClick={() => navigate(`/roles/${r.id}`)}>
            {r.esSistema ? "Ver" : "Editar"}
          </Btn>
          <IconBtn icon={Copy} title="Duplicar" size="sm" onClick={() => duplicar(r)} />
          {!r.esSistema && (
            <IconBtn
              icon={Trash2}
              title={r.personas ? "Reasigna antes a las personas que lo tienen" : "Borrar"}
              tone="peligro"
              size="sm"
              disabled={r.personas > 0}
              onClick={() => borrar(r)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Roles y permisos"
        subtitulo={`${roles.length} roles · ${PERMISSIONS.length} permisos disponibles`}
        acciones={<Btn icon={Plus} onClick={() => navigate("/roles/nuevo")}>Nuevo rol</Btn>}
      />

      <div style={{ padding: "24px 28px 48px" }}>
        {error && (
          <div style={{
            background: T.apoyoTint, color: T.apoyo, borderRadius: T.radiusSm,
            padding: "10px 14px", fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <Table
          columnas={columnas}
          filas={filas}
          ordenInicial={{ clave: "personas", dir: "desc" }}
          vacio="Todavía no hay roles."
        />

        <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 12, lineHeight: 1.5 }}>
          Los roles marcados con candado son de sistema: no se editan ni se borran,
          para que siempre quede uno con acceso completo. Duplícalos para partir de ellos.
          Un rol con personas asignadas no se puede borrar — reasígnalas primero.
        </div>
      </div>
    </>
  );
}
