import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { T } from "../theme.js";
import { visibleChildren } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { fmtDateShort } from "../lib/format.js";
import { Avatar, Chip, Table } from "../ui/index.js";
import PageHeader from "../shell/PageHeader.jsx";

// Listado de pacientes.
//
// El alcance lo resuelve visibleChildren y no esta pantalla: un especialista ve
// los suyos y direccion clinica los ve todos, sin un solo `if` sobre el rol.
export default function PatientsList({ onOpenChild }) {
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const currentUser = useAuthStore((s) => s.currentUser);

  // El menu lateral enlaza a ?estado=activo|inactivo, asi que el filtro vive en
  // la URL y no en estado local: de otro modo esos enlaces no harian nada.
  const [searchParams] = useSearchParams();
  const estado = searchParams.get("estado");

  const [query, setQuery] = useState("");
  const [especialidad, setEspecialidad] = useState("Todas");

  const alcance = useMemo(
    () => visibleChildren(currentUser, children),
    [currentUser, children],
  );

  const especialidades = useMemo(
    () => ["Todas", ...Array.from(new Set(alcance.flatMap((c) => c.specialties))).sort()],
    [alcance],
  );

  // Se precalcula por paciente para no recorrer las 438 sesiones en cada celda
  // ni, peor, en cada comparacion del ordenamiento.
  const filas = useMemo(() => alcance.map((c) => {
    const suyas = sessions.filter((s) => s.childId === c.id);
    const ultima = suyas.length
      ? suyas.reduce((a, b) => (a.date > b.date ? a : b)).date
      : null;
    return {
      ...c,
      nombre: `${c.name} ${c.lastName}`,
      sesiones: suyas.length,
      ultima,
      equipo: c.assignedSpecialists
        .map((id) => users.find((u) => u.id === id)?.name.split(" ")[0])
        .filter(Boolean)
        .join(", "),
    };
  }), [alcance, sessions, users]);

  const filtradas = useMemo(() => filas.filter((c) => {
    const coincide = c.nombre.toLowerCase().includes(query.trim().toLowerCase());
    const porEspecialidad = especialidad === "Todas" || c.specialties.includes(especialidad);
    const porEstado = !estado
      || (estado === "activo" && c.status !== "inactivo")
      || (estado === "inactivo" && c.status === "inactivo");
    return coincide && porEspecialidad && porEstado;
  }), [filas, query, especialidad, estado]);

  const columnas = [
    {
      clave: "nombre", titulo: "Paciente", ancho: "2fr",
      celda: (c) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar name={c.nombre} bg={c.avatarBg} size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {c.nombre}
            </div>
            {c.status === "inactivo" && (
              <div style={{ fontSize: 11.5, color: T.inkFaint }}>Inactivo</div>
            )}
          </div>
        </div>
      ),
    },
    {
      clave: "age", titulo: "Edad", ancho: "70px",
      celda: (c) => <span style={{ color: T.inkSoft }}>{c.age != null ? `${c.age} a` : "—"}</span>,
    },
    {
      clave: "specialties", titulo: "Especialidad", ancho: "1.4fr",
      valor: (c) => c.specialties.join(", "),
      celda: (c) => (
        <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{c.specialties.join(" · ") || "—"}</span>
      ),
    },
    {
      clave: "equipo", titulo: "Equipo", ancho: "1.2fr",
      celda: (c) => <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{c.equipo || "Sin asignar"}</span>,
    },
    {
      clave: "sesiones", titulo: "Sesiones", ancho: "90px", alinear: "derecha",
      celda: (c) => <span style={{ fontWeight: 600 }}>{c.sesiones}</span>,
    },
    {
      clave: "ultima", titulo: "Última sesión", ancho: "130px", alinear: "derecha",
      celda: (c) => (
        <span style={{ color: c.ultima ? T.inkSoft : T.inkFaint, fontSize: 12.5 }}>
          {c.ultima ? fmtDateShort(c.ultima) : "Sin sesiones"}
        </span>
      ),
    },
  ];

  const titulo = estado === "activo" ? "Pacientes activos"
    : estado === "inactivo" ? "Pacientes inactivos"
    : "Pacientes";

  return (
    <>
      <PageHeader
        titulo={titulo}
        subtitulo={`${filtradas.length} de ${alcance.length}`}
        buscar={query}
        onBuscar={setQuery}
      />

      <div style={{ padding: "24px 28px 48px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {especialidades.map((e) => (
            <Chip
              key={e}
              label={e}
              selected={especialidad === e}
              onClick={() => setEspecialidad(e)}
            />
          ))}
        </div>

        <Table
          columnas={columnas}
          filas={filtradas}
          onFila={(c) => onOpenChild(c.id)}
          ordenInicial={{ clave: "nombre", dir: "asc" }}
          vacio={alcance.length === 0
            ? "No tienes pacientes asignados."
            : "Ningún paciente coincide con la búsqueda."}
        />
      </div>
    </>
  );
}
