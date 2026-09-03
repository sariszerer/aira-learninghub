import React, { useState, useMemo } from "react";
import { T } from "../theme.js";
import { visibleChildren } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Avatar } from "../ui/index.js";
import PageHeader from "../shell/PageHeader.jsx";

// Listado completo de pacientes con busqueda y filtro por especialidad.
//
// El alcance lo resuelve visibleChildren, no esta pantalla: un especialista ve
// los suyos y direccion clinica los ve todos, sin que aqui haya un solo `if`
// sobre el rol.
export default function PatientsList({ onOpenChild }) {
  const children = useDataStore((s) => s.children);
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const currentUser = useAuthStore((s) => s.currentUser);

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

  const filtrados = useMemo(() => alcance.filter((c) => {
    const nombre = `${c.name} ${c.lastName}`.toLowerCase();
    const coincide = nombre.includes(query.trim().toLowerCase());
    const porEspecialidad = especialidad === "Todas" || c.specialties.includes(especialidad);
    return coincide && porEspecialidad;
  }), [alcance, query, especialidad]);

  const ultimaSesion = (childId) => {
    const propias = sessions.filter((s) => s.childId === childId);
    if (!propias.length) return null;
    return propias.sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  return (
    <>
      <PageHeader
        titulo="Pacientes"
        subtitulo={`${filtrados.length} de ${alcance.length}`}
        buscar={query}
        onBuscar={setQuery}
      />

      <div style={{ padding: "20px 28px 48px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {especialidades.map((e) => (
            <button
              key={e}
              onClick={() => setEspecialidad(e)}
              style={{
                padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                fontFamily: T.font, fontSize: 12.5,
                fontWeight: especialidad === e ? 600 : 500,
                border: `1px solid ${especialidad === e ? T.brand : T.border}`,
                background: especialidad === e ? T.brandTint : T.surface,
                color: especialidad === e ? T.brand : T.inkSoft,
              }}
            >
              {e}
            </button>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
            padding: "48px 20px", textAlign: "center", color: T.inkFaint, fontSize: 14,
          }}>
            {alcance.length === 0
              ? "No tienes pacientes asignados."
              : "Ningún paciente coincide con la búsqueda."}
          </div>
        ) : (
          <div style={{
            display: "grid", gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}>
            {filtrados.map((c) => {
              const ultima = ultimaSesion(c.id);
              const especialistas = c.assignedSpecialists
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean);
              return (
                <button
                  key={c.id}
                  onClick={() => onOpenChild(c.id)}
                  style={{
                    textAlign: "left", cursor: "pointer", padding: 16,
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: T.radius, boxShadow: T.shadow, fontFamily: T.font,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                    <Avatar name={`${c.name} ${c.lastName}`} bg={c.avatarBg} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14.5, fontWeight: 600, color: T.ink,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {c.name} {c.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: T.inkFaint }}>
                        {c.age != null ? `${c.age} años` : "Edad pendiente"}
                      </div>
                    </div>
                    {c.status === "inactivo" && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: T.inkSoft,
                        background: T.surfaceSunk, borderRadius: 999, padding: "2px 9px",
                      }}>
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>
                    {c.specialties.join(" · ")}
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: `1px solid ${T.borderSoft}`, paddingTop: 10,
                    fontSize: 11.5, color: T.inkFaint,
                  }}>
                    <span>{especialistas.map((u) => u.name.split(" ")[0]).join(", ") || "Sin asignar"}</span>
                    <span>{ultima ? `Últ. ${ultima.date}` : "Sin sesiones"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
