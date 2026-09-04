import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { T } from "../theme.js";
import { PERMISSIONS } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, Card, Chip } from "../ui/index.js";
import PageHeader from "../shell/PageHeader.jsx";

const SCOPES = [
  { val: "todos", label: "Todos los pacientes" },
  { val: "asignados", label: "Solo los asignados" },
  { val: "un_nino", label: "Un solo niño" },
];

const HOMES = [
  { val: "admin", label: "Panel administrativo" },
  { val: "clinico", label: "Panel clínico" },
  { val: "especialista", label: "Mis pacientes" },
  { val: "tutor", label: "Panel de tutor" },
];

const COLORES = ["#1E79E2", "#06B6D4", "#818CF8", "#10B981", "#F59E0B", "#EF4444", "#0E7490", "#7C3AED"];

// Los permisos que terminan en :own/:any no son dos casillas independientes.
// Marcar :any sin :own es un estado sin significado que un administrador
// produciria por accidente, asi que el par se presenta como una sola eleccion
// de tres estados y ese estado deja de ser representable.
function paresYSueltos() {
  const pares = new Map();
  const sueltos = [];
  for (const p of PERMISSIONS) {
    const m = p.key.match(/^(.*):(own|any)$/);
    if (m) {
      const base = m[1];
      if (!pares.has(base)) pares.set(base, { base, grupo: p.grupo, descripcion: p.descripcion });
      continue;
    }
    sueltos.push(p);
  }
  return { pares: [...pares.values()], sueltos };
}

const { pares: PARES, sueltos: SUELTOS } = paresYSueltos();

const GRUPOS = [...new Set(PERMISSIONS.map((p) => p.grupo))];

export default function RoleEditor() {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const roles = useDataStore((s) => s.rolesDisponibles);
  const users = useDataStore((s) => s.users);
  const guardarRol = useDataStore((s) => s.guardarRol);
  const cargarRoles = useDataStore((s) => s.cargarRoles);

  // Entrar directo por URL no pasa por la lista, que es donde se cargan. Sin
  // esto, /roles/specialist mostraba "no encontrado" en una recarga.
  const [cargando, setCargando] = useState(roles.length === 0);
  useEffect(() => {
    if (roles.length) { setCargando(false); return }
    cargarRoles().finally(() => setCargando(false));
  }, [roles.length, cargarRoles]);

  const esNuevo = !roleId || roleId === "nuevo";
  const original = esNuevo ? null : roles.find((r) => r.id === roleId);

  const [form, setForm] = useState(() => original || {
    id: "", nombre: "", scope: "asignados", home: "especialista",
    esClinico: true, etiqueta: "", color: COLORES[0], permisos: [],
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Si el rol llega despues de la carga, el formulario se rellena entonces.
  useEffect(() => {
    if (original && !form.id) setForm(original);
  }, [original]); // eslint-disable-line react-hooks/exhaustive-deps

  const conEsteRol = useMemo(
    () => users.filter((u) => u.role === form.id).length,
    [users, form.id],
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const tiene = (k) => form.permisos.includes(k);

  const alternar = (k) => set("permisos", tiene(k)
    ? form.permisos.filter((x) => x !== k)
    : [...form.permisos, k]);

  // Estado del par: "ninguno" | "own" | "any"
  const estadoPar = (base) => tiene(`${base}:any`) ? "any" : tiene(`${base}:own`) ? "own" : "ninguno";
  const ponerPar = (base, estado) => {
    const sin = form.permisos.filter((k) => k !== `${base}:own` && k !== `${base}:any`);
    set("permisos", estado === "ninguno" ? sin : [...sin, `${base}:${estado}`]);
  };

  const idValido = /^[a-z][a-z0-9_-]{2,30}$/.test(form.id);
  const valido = form.nombre.trim() && form.etiqueta.trim() && (!esNuevo || idValido);
  const bloqueado = original?.esSistema;

  const guardar = async () => {
    setError(null); setGuardando(true);
    try {
      await guardarRol({ ...form, nombre: form.nombre.trim(), etiqueta: form.etiqueta.trim() }, esNuevo);
      navigate("/roles");
    } catch (e) {
      setError(e.message || "No se pudo guardar el rol.");
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <>
        <PageHeader titulo="Cargando…" />
        <div style={{ padding: "48px 28px", color: T.inkFaint, fontSize: 14 }}>
          Cargando el rol…
        </div>
      </>
    );
  }

  if (!esNuevo && !original) {
    return (
      <>
        <PageHeader titulo="Rol no encontrado" />
        <div style={{ padding: "24px 28px" }}>
          <Btn variant="secondary" icon={ArrowLeft} onClick={() => navigate("/roles")}>Volver</Btn>
        </div>
      </>
    );
  }

  const campo = (etiqueta, k, opciones = {}) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {etiqueta}
      </div>
      <input
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        disabled={opciones.disabled || bloqueado}
        placeholder={opciones.placeholder}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font,
          outline: "none",
          background: (opciones.disabled || bloqueado) ? T.surfaceSunk : T.surface,
          color: (opciones.disabled || bloqueado) ? T.inkFaint : T.ink,
        }}
      />
      {opciones.nota && (
        <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 4 }}>{opciones.nota}</div>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        titulo={esNuevo ? "Nuevo rol" : `Editar ${original.nombre}`}
        subtitulo={bloqueado
          ? "Rol de sistema: solo lectura. Duplícalo para partir de él."
          : `${form.permisos.length} de ${PERMISSIONS.length} permisos`}
        acciones={
          <>
            <Btn variant="secondary" icon={ArrowLeft} onClick={() => navigate("/roles")}>Volver</Btn>
            {!bloqueado && (
              <Btn onClick={guardar} disabled={!valido || guardando}>
                {guardando ? "Guardando…" : esNuevo ? "Crear rol" : "Guardar"}
              </Btn>
            )}
          </>
        }
      />

      <div style={{ padding: "24px 28px 48px", display: "grid", gap: 16, gridTemplateColumns: "320px 1fr" }}>
        <div>
          <Card>
            {campo("Nombre", "nombre", { placeholder: "Terapeuta suplente" })}
            {campo("Etiqueta", "etiqueta", {
              placeholder: "Suplente",
              nota: "Es lo que se ve junto al nombre de la persona.",
            })}
            {esNuevo && campo("Identificador", "id", {
              placeholder: "suplente",
              nota: idValido || !form.id
                ? "Minúsculas, sin espacios. No se puede cambiar después."
                : "Debe empezar por letra: minúsculas, números, guion o guion bajo.",
            })}

            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Qué pacientes alcanza
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {SCOPES.map((s) => (
                  <Chip key={s.val} label={s.label} selected={form.scope === s.val}
                    onClick={() => !bloqueado && set("scope", s.val)} />
                ))}
              </div>
              {!esNuevo && conEsteRol > 0 && original.scope !== form.scope && (
                <div style={{
                  display: "flex", gap: 6, marginTop: 8, padding: "8px 10px",
                  background: T.procesoTint, borderRadius: T.radiusSm,
                  fontSize: 11.5, color: T.amberDeep,
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    Afecta a {conEsteRol} persona{conEsteRol === 1 ? "" : "s"} que tiene{conEsteRol === 1 ? "" : "n"} este rol.
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Panel al iniciar sesión
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {HOMES.map((h) => (
                  <Chip key={h.val} label={h.label} selected={form.home === h.val}
                    onClick={() => !bloqueado && set("home", h.val)} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Chip
                label="Aparece en selectores de terapeuta"
                selected={form.esClinico}
                casilla
                onClick={() => !bloqueado && set("esClinico", !form.esClinico)}
              />
            </div>

            <div>
              <div style={{
                fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Color
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {COLORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => !bloqueado && set("color", c)}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", background: c,
                      cursor: bloqueado ? "default" : "pointer",
                      border: form.color === c ? `2px solid ${T.ink}` : "2px solid transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>

          {error && (
            <div style={{
              marginTop: 12, background: T.apoyoTint, color: T.apoyo,
              borderRadius: T.radiusSm, padding: "10px 12px", fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </div>

        <Card>
          {GRUPOS.map((grupo) => {
            const sueltos = SUELTOS.filter((p) => p.grupo === grupo);
            const pares = PARES.filter((p) => p.grupo === grupo);
            if (!sueltos.length && !pares.length) return null;
            return (
              <div key={grupo} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: T.inkSoft, marginBottom: 8,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {grupo}
                </div>

                {sueltos.map((p) => (
                  <div key={p.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                    borderTop: `1px solid ${T.borderSoft}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: T.ink }}>{p.descripcion}</div>
                      {p.key === "role:manage" && tiene(p.key) && (
                        <div style={{
                          display: "flex", gap: 5, marginTop: 4,
                          fontSize: 11.5, color: T.apoyo,
                        }}>
                          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                          Quien tenga este rol podrá modificar los permisos de cualquier otro.
                        </div>
                      )}
                    </div>
                    <Chip
                      label={tiene(p.key) ? "Sí" : "No"}
                      selected={tiene(p.key)}
                      size="sm"
                      onClick={() => !bloqueado && alternar(p.key)}
                    />
                  </div>
                ))}

                {pares.map((p) => {
                  const estado = estadoPar(p.base);
                  return (
                    <div key={p.base} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                      borderTop: `1px solid ${T.borderSoft}`,
                    }}>
                      <div style={{ flex: 1, fontSize: 13.5, color: T.ink }}>
                        {p.descripcion.replace(/ sus propi[oa]s?| de cualquiera/g, "")}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[
                          { val: "ninguno", label: "No" },
                          { val: "own", label: "Solo los suyos" },
                          { val: "any", label: "Todos" },
                        ].map((o) => (
                          <Chip
                            key={o.val}
                            label={o.label}
                            selected={estado === o.val}
                            size="sm"
                            onClick={() => !bloqueado && ponerPar(p.base, o.val)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Card>
      </div>
    </>
  );
}
