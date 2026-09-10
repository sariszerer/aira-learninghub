import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, HeartHandshake, Plus, School, Users } from "lucide-react";
import { T } from "../theme.js";
import { fmtDate, contar } from "../lib/format.js";
import { can, ROLES } from "../permissions.js";
import { Btn, Card, Chip } from "../ui/index.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";
import { terapeutasDeColegio } from "./terapeutas.js";
import { useEsMovil, paddingPagina } from "../lib/pantalla.js";

// Listado de colegios del gabinete. La ficha de cada uno vive en su propia ruta
// (/gabinete/:schoolId) y no en una columna al lado: son tres bloques anchos y
// no cabian en el espacio que dejaba la lista.

function GabinetePanel() {
  const esMovil = useEsMovil();
  const schools = useDataStore((s) => s.schools);
  const users = useDataStore((s) => s.users);
  const onAddSchool = useDataStore((s) => s.addSchool);
  const estudiantesGabinete = useDataStore((s) => s.estudiantesGabinete);
  const tutores = useDataStore((s) => s.tutores);
  const currentUser = useAuthStore((s) => s.currentUser);
  const navegar = useNavigate();

  const [addingSchool, setAddingSchool] = useState(false);
  const VACIA = {
    name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "",
    specialty: "", assignedSpecialists: [], notes: "", programa: "tutoria",
  };
  const [newSchool, setNewSchool] = useState(VACIA);

  const allSpecialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const handleSaveSchool = async () => {
    const falta = queFalta([[!!newSchool.name.trim(), "el nombre del colegio"]]);
    if (falta) { avisar.error(falta); return; }
    const id = `sch-${Date.now()}`;
    // Si el alta falla, addSchool ya publicó el error y aquí se corta: ni se
    // adjunta el contrato ni se confirma nada. El formulario se queda abierto
    // con lo escrito, que es lo que permite reintentar sin volver a teclearlo.
    try {
      await onAddSchool({ id, ...newSchool, students: [] });
    } catch {
      return;
    }
    // Confirmación explícita, y no solo aquí por gusto: este es el flujo en el
    // que un guardado fallido pasó por bueno — la escuela aparecía en la lista y
    // solo al refrescar se supo que la base nunca la recibió. Si algo falla, el
    // store publica el error por este mismo canal y no se llega a esta línea con
    // un "guardada" falso, porque addSchool ya avisó.
    avisar.exito(`Escuela "${newSchool.name.trim()}" guardada`);
    setAddingSchool(false);
    setNewSchool(VACIA);
  };


  return (
    <div style={{ padding: paddingPagina(esMovil) }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.ink }}>Gabinete Externo</div>
          <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>{schools.length} escuela{schools.length !== 1 ? "s" : ""} con contrato activo</div>
        </div>
        {can(currentUser, "school:create") && (
          <Btn icon={Plus} onClick={() => setAddingSchool(true)}>Agregar escuela</Btn>
        )}
      </div>

      {/* Add school modal */}
      {addingSchool && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.font, fontSize: 18, color: T.ink, marginBottom: 18 }}>Nueva escuela</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field2 label="Nombre del colegio" value={newSchool.name} onChange={(v) => setNewSchool({ ...newSchool, name: v })} />
            <Field2 label="Contacto" value={newSchool.contact} onChange={(v) => setNewSchool({ ...newSchool, contact: v })} />
            <Field2 label="Teléfono" value={newSchool.phone} onChange={(v) => setNewSchool({ ...newSchool, phone: v })} />
            <Field2 label="Email" value={newSchool.email} onChange={(v) => setNewSchool({ ...newSchool, email: v })} type="email" />
            <Field2 label="Inicio de contrato" value={newSchool.contractStart} onChange={(v) => setNewSchool({ ...newSchool, contractStart: v })} type="date" />
            <Field2 label="Fin de contrato" value={newSchool.contractEnd} onChange={(v) => setNewSchool({ ...newSchool, contractEnd: v })} type="date" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Programa</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["tutoria", "Tutoría"], ["preescolar", "Detección y atención en preescolar"]].map(([v, txt]) => (
                <Chip key={v} label={txt} selected={newSchool.programa === v} onClick={() => setNewSchool({ ...newSchool, programa: v })} />
              ))}
            </div>
          </div>
          <Field2 label="Especialidades contratadas" value={newSchool.specialty} onChange={(v) => setNewSchool({ ...newSchool, specialty: v })} />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Especialistas asignados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allSpecialists.map((sp) => {
                const sel = newSchool.assignedSpecialists.includes(sp.id);
                return (
                  <Chip
                    key={sp.id}
                    label={sp.name.split(" ")[0]}
                    selected={sel}
                    casilla
                    onClick={() => setNewSchool({ ...newSchool, assignedSpecialists: sel
                      ? newSchool.assignedSpecialists.filter((x) => x !== sp.id)
                      : [...newSchool.assignedSpecialists, sp.id] })}
                  />
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notas del contrato</div>
            <textarea value={newSchool.notes} onChange={(e) => setNewSchool({ ...newSchool, notes: e.target.value })} rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setAddingSchool(false)}>Cancelar</Btn>
            <Btn onClick={handleSaveSchool}>Guardar escuela</Btn>
          </div>
        </Card>
      )}

      {schools.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: T.inkFaint }}>
          <School size={38} color={T.inkFaint} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: T.inkSoft, marginBottom: 8 }}>Ninguna escuela registrada aún</div>
          <div style={{ fontSize: 13.5 }}>Agrega la primera escuela con el botón de arriba</div>
        </div>
      ) : (
        <div style={{
          display: "grid", gap: 14,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}>
          {schools.map((s) => {
            const estudiantes = estudiantesGabinete.filter((e) => e.schoolId === s.id).length;
            const equipo = terapeutasDeColegio(tutores, estudiantesGabinete, s.id).length;
            const preescolar = (s.programa || "tutoria") === "preescolar";
            return (
              <button
                key={s.id} type="button"
                onClick={() => navegar(`/gabinete/${encodeURIComponent(s.id)}`)}
                style={{
                  display: "flex", flexDirection: "column", gap: 12, textAlign: "left",
                  padding: "17px 18px", borderRadius: 14, cursor: "pointer",
                  background: T.surface, border: `1px solid ${T.border}`,
                  boxShadow: T.shadow, fontFamily: T.font,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: preescolar ? `${T.amber}22` : T.brandTint,
                    color: preescolar ? T.amberDeep : T.brand,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {preescolar ? <GraduationCap size={19} /> : <School size={19} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink }}>{s.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                      {preescolar ? "Detección y atención en preescolar" : "Tutoría"}
                    </span>
                  </span>
                </div>

                {/* Las dos cifras que dicen si el programa esta vivo en ese
                    centro. Un colegio con contrato y cero estudiantes es algo
                    que se ve desde aqui sin tener que entrar. */}
                <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: T.inkSoft }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Users size={13} color={T.inkFaint} />
                    {contar(estudiantes, "estudiante", "estudiantes")}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <HeartHandshake size={13} color={T.inkFaint} />
                    {contar(equipo, "terapeuta", "terapeutas")}
                  </span>
                </div>

                <div style={{
                  fontSize: 11.5, color: T.inkFaint, borderTop: `1px solid ${T.borderSoft}`,
                  paddingTop: 9, marginTop: "auto",
                }}>
                  {s.contractStart ? `Contrato desde ${fmtDate(s.contractStart)}` : "Sin fecha de contrato"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GabinetePanel;

// Definido FUERA del componente a proposito.
//
// Estaba dentro, y eso lo convertia en un TIPO de componente nuevo en cada
// render: React desmontaba el input y montaba otro, asi que el campo perdia el
// foco despues de cada tecla y habia que volver a hacer clic para escribir la
// siguiente letra.
function Field2({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
    </div>
  );
}
