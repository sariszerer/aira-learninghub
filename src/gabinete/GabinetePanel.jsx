import React, { useState } from "react";
import { T, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { ROLES } from "../permissions.js";
import { Eyebrow, Card, Chip } from "../ui/index.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn } from "../ui/index.js";
import { FileText, Plus, School, Trash2 } from "lucide-react";
import { DOC_TYPES_GABINETE } from "../constants.js";
import { can } from "../permissions.js";
import { useAuthStore } from "../store/authStore.js";
import { IconBtn } from "../ui/index.js";
import AddDocumentModal from "../patient/modals/AddDocumentModal.jsx";
import EstudianteModal from "./EstudianteModal.jsx";
import ExpedienteEstudiante from "./ExpedienteEstudiante.jsx";
import { GraduationCap, Users } from "lucide-react";
import { Avatar } from "../ui/index.js";
import { contar } from "../lib/format.js";

function GabinetePanel({ onAddSession }) {
  const schools = useDataStore((s) => s.schools);
  const users = useDataStore((s) => s.users);
  const gabineteSessions = useDataStore((s) => s.gabineteSessions);
  const onAddSchool = useDataStore((s) => s.addSchool);
  const documents = useDataStore((s) => s.documents);
  const borrarColegio = useDataStore((s) => s.borrarColegio);
  const agregarDocumentoDeColegio = useDataStore((s) => s.agregarDocumentoDeColegio);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [subiendo, setSubiendo] = useState(null);
  const [errorColegio, setErrorColegio] = useState(null);
  const estudiantesGabinete = useDataStore((s) => s.estudiantesGabinete);
  const tutores = useDataStore((s) => s.tutores);
  const guardarEstudiante = useDataStore((s) => s.guardarEstudianteGabinete);
  const [editandoEstudiante, setEditandoEstudiante] = useState(null);
  const [viendoExpediente, setViendoExpediente] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [addingSchool, setAddingSchool] = useState(false);
  const [sessionForm, setSessionForm] = useState(null);
  const VACIA = { name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "", specialty: "", assignedSpecialists: [], notes: "", programa: "tutoria" };
  const [newSchool, setNewSchool] = useState(VACIA);

  const school = schools.find((s) => s.id === selectedSchool) || schools[0] || null;
  const schoolSessions = school ? gabineteSessions.filter((s) => s.schoolId === school.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  const allSpecialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const delColegio = school ? estudiantesGabinete.filter((e) => e.schoolId === school.id) : [];
  const esTutoria = (school?.programa || "tutoria") === "tutoria";

  const emptySession = () => ({ specialistId: "", specialty: "", date: TODAY, participants: "", duration: 60, area: "", notes: "" });

  const handleSaveSession = () => {
    // La especialidad no se pide en el formulario y se guardaba vacia: sale de
    // quien imparte, que si se elige.
    const especialidad = allSpecialists.find((u) => u.id === sessionForm.specialistId)?.specialty || "";
    onAddSession({ id: `gs-${Date.now()}`, schoolId: school.id, ...sessionForm, specialty: especialidad });
    setSessionForm(null);
  };

  const handleSaveSchool = () => {
    onAddSchool({ id: `sch-${Date.now()}`, ...newSchool, students: [] });
    setAddingSchool(false);
    setNewSchool(VACIA);
  };

  const Field2 = ({ label, value, onChange, type = "text" }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 28px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.ink }}>Gabinete Externo</div>
          <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>{schools.length} escuela{schools.length !== 1 ? "s" : ""} con contrato activo</div>
        </div>
        <Btn icon={Plus} onClick={() => setAddingSchool(true)}>Agregar escuela</Btn>
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
            <Btn onClick={handleSaveSchool} disabled={!newSchool.name.trim()}>Guardar escuela</Btn>
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
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
          {/* School list */}
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Escuelas</Eyebrow>
            {schools.map((s) => (
              <div key={s.id} onClick={() => setSelectedSchool(s.id)}
                style={{
                  padding: "14px 16px", borderRadius: 13, marginBottom: 8, cursor: "pointer",
                  background: (school && school.id === s.id) ? T.brand : "#fff",
                  border: `1px solid ${(school && school.id === s.id) ? T.brand : T.border}`,
                  boxShadow: T.shadow,
                }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: (school && school.id === s.id) ? "#fff" : T.ink }}>{s.name}</div>
                <div style={{ fontSize: 12, color: (school && school.id === s.id) ? "rgba(255,255,255,0.75)" : T.inkSoft, marginTop: 3 }}>{s.specialty || "Sin especialidad definida"}</div>
              </div>
            ))}
          </div>

          {/* Expediente de un estudiante: ocupa el detalle entero. Verlo en un
              modal sobre la escuela escondia justo lo que se va a leer. */}
          {school && viendoExpediente ? (
            <ExpedienteEstudiante
              estudiante={estudiantesGabinete.find((e) => e.id === viendoExpediente) || viendoExpediente}
              onVolver={() => setViendoExpediente(null)}
            />
          ) : school && (
            <div>
              <Card style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color: T.ink }}>{school.name}</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{school.contact}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {school.phone && <a href={`tel:${school.phone}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>{school.phone}</a>}
                    {school.email && <a href={`mailto:${school.email}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>{school.email}</a>}
                    {can(currentUser, "school:create") && (
                      <IconBtn
                        icon={Trash2} tone="peligro" size="sm"
                        title="Eliminar colegio"
                        onClick={async () => {
                          const n = gabineteSessions.filter((x) => x.schoolId === school.id).length;
                          const d = documents.filter((x) => x.schoolId === school.id).length;
                          const detalle = [n && `${n} sesión${n === 1 ? "" : "es"}`, d && `${d} documento${d === 1 ? "" : "s"}`]
                            .filter(Boolean).join(" y ");
                          // Se dice QUE se lleva por delante antes de preguntar:
                          // "¿seguro?" a secas no da con que decidir.
                          const aviso = detalle
                            ? `Se eliminará ${school.name} junto con ${detalle}. No se puede deshacer.`
                            : `Se eliminará ${school.name}. No se puede deshacer.`;
                          if (!window.confirm(aviso)) return;
                          setErrorColegio(null);
                          try {
                            await borrarColegio(school.id);
                            setSelectedSchool(null);
                          } catch (e) {
                            setErrorColegio(e.message || "No se pudo eliminar el colegio.");
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                  {[
                    { label: "Contrato desde", value: school.contractStart ? fmtDate(school.contractStart) : "—" },
                    { label: "Contrato hasta", value: school.contractEnd ? fmtDate(school.contractEnd) : "—" },
                    { label: "Sesiones realizadas", value: gabineteSessions.filter((s) => s.schoolId === school.id).length },
                  ].map((it) => (
                    <div key={it.label} style={{ background: T.surfaceSunk, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 4 }}>{it.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>{it.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Especialistas asignados</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(school.assignedSpecialists || []).map((sid) => {
                      const sp = users.find((u) => u.id === sid);
                      if (!sp) return null;
                      return (
                        <span key={sid} style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 13 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: sp.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{sp.name[0]}</div>
                          {sp.name.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {school.notes && <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 10, }}>{school.notes}</div>}
                {errorColegio && (
                  <div style={{
                    marginTop: 12, background: T.apoyoTint, color: T.apoyo,
                    borderRadius: T.radiusSm, padding: "9px 12px", fontSize: 13,
                  }}>
                    {errorColegio}
                  </div>
                )}
              </Card>

              {/* Estudiantes. Solo en el programa de tutoria: el de preescolar
                  no acompaña a un niño concreto sino a un grupo. */}
              {esTutoria && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
                    <Eyebrow>Estudiantes con tutor</Eyebrow>
                    {can(currentUser, "gabinete:session:create") && (
                      <Btn size="sm" icon={Plus} onClick={() => setEditandoEstudiante({ nuevo: true })}>Agregar estudiante</Btn>
                    )}
                  </div>

                  {delColegio.length === 0 ? (
                    <Card style={{ padding: "26px 20px", textAlign: "center" }}>
                      <GraduationCap size={30} color={T.inkFaint} style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.inkSoft, marginBottom: 5 }}>
                        Ningún estudiante registrado en {school.name}
                      </div>
                      <div style={{ fontSize: 13, color: T.inkFaint }}>
                        Cada estudiante tiene su tutora y su expediente: plan de trabajo,
                        registros de supervisión y reportes quincenales.
                      </div>
                    </Card>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                      {delColegio.map((e) => {
                        const tutor = tutores.find((t) => t.id === e.tutorId);
                        const docs = documents.filter((d) => d.studentId === e.id).length;
                        return (
                          <Card key={e.id} style={{ padding: "14px 16px" }}>
                            <button
                              type="button"
                              onClick={() => setViendoExpediente(e.id)}
                              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: T.font }}
                            >
                              <Avatar name={`${e.name} ${e.lastName || ""}`} bg={T.brand} size={36} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {e.name} {e.lastName || ""}
                                </div>
                                <div style={{ fontSize: 11.5, color: T.inkFaint }}>
                                  {e.grade || "Sin grado"}
                                </div>
                              </div>
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: T.inkSoft }}>
                              <Users size={12} color={T.inkFaint} />
                              {tutor ? tutor.name : <span style={{ fontStyle: "italic", color: T.inkFaint }}>Sin tutora asignada</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                              <span style={{ fontSize: 11.5, color: T.inkFaint }}>{contar(docs, "documento", "documentos")}</span>
                              {can(currentUser, "gabinete:session:create") && (
                                <Btn size="sm" variant="ghost" onClick={() => setEditandoEstudiante(e)}>Editar</Btn>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Documentos del colegio. Cuelgan del contrato, no de un
                  paciente: son el expediente del gabinete con esa escuela. */}
              <div style={{ marginBottom: 22 }}>
                <Eyebrow style={{ marginBottom: 12 }}>Documentos del colegio</Eyebrow>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(DOC_TYPES_GABINETE).map(([tipo, meta]) => {
                    const suyos = documents
                      .filter((d) => d.schoolId === school.id && d.type === tipo)
                      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                    return (
                      <Card key={tipo} style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <FileText size={16} color={T.brand} />
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{meta.label}</div>
                            <span style={{ fontSize: 11.5, color: T.inkFaint }}>
                              {suyos.length ? `${suyos.length} guardado${suyos.length === 1 ? "" : "s"}` : "Ninguno todavía"}
                            </span>
                          </div>
                          {can(currentUser, "gabinete:session:create") && (
                            <Btn size="sm" variant="secondary" icon={Plus} onClick={() => setSubiendo(tipo)}>Subir</Btn>
                          )}
                        </div>
                        {suyos.length > 0 && (
                          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                            {suyos.map((d) => (
                              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
                                <span style={{ color: T.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {d.title}
                                </span>
                                <span style={{ color: T.inkFaint, whiteSpace: "nowrap" }}>
                                  {d.date ? fmtDate(d.date) : "sin fecha"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              {editandoEstudiante && (
                <EstudianteModal
                  estudiante={editandoEstudiante.nuevo ? null : editandoEstudiante}
                  schoolId={school.id}
                  onClose={() => setEditandoEstudiante(null)}
                  onGuardar={guardarEstudiante}
                />
              )}

              {subiendo && (
                <AddDocumentModal
                  type={subiendo}
                  meta={DOC_TYPES_GABINETE[subiendo]}
                  onClose={() => setSubiendo(null)}
                  onSave={(doc) => { agregarDocumentoDeColegio(school.id, doc); setSubiendo(null); }}
                />
              )}

              {/* Sessions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <Eyebrow>Sesiones de gabinete</Eyebrow>
                {/* Llamaba a setAddingSession, un setter que no existe en
                    este componente: pulsarlo lanzaba un ReferenceError en vez
                    de abrir el formulario. emptySession ya estaba escrito y
                    sin usar. */}
                <Btn icon={Plus} onClick={() => setSessionForm(emptySession())}>Registrar sesión</Btn>
              </div>

              {sessionForm && (
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: T.font, fontSize: 16, color: T.ink, marginBottom: 16 }}>Nueva sesión — {school.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha</div>
                      <input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Especialista</div>
                      <select value={sessionForm.specialistId} onChange={(e) => setSessionForm({ ...sessionForm, specialistId: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }}>
                        <option value="">Seleccionar...</option>
                        {allSpecialists.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Participantes / grupo</div>
                    <input value={sessionForm.participants} onChange={(e) => setSessionForm({ ...sessionForm, participants: e.target.value })} placeholder="Ej: Grupo 3ro primaria, 12 niños"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Área trabajada</div>
                    <input value={sessionForm.area} onChange={(e) => setSessionForm({ ...sessionForm, area: e.target.value })} placeholder="Ej: Regulación emocional, Habilidades sociales..."
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Observaciones</div>
                    <textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={3} placeholder="Notas, resultados, próximos pasos..."
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setSessionForm(null)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13.5, fontFamily: T.font, cursor: "pointer" }}>Cancelar</button>
                    <Btn onClick={handleSaveSession} disabled={!sessionForm.date || !sessionForm.specialistId}>Guardar sesión</Btn>
                  </div>
                </Card>
              )}

              {schoolSessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: T.inkFaint, fontSize: 13.5 }}>Ninguna sesión registrada aún</div>
              ) : (
                schoolSessions.map((s) => {
                  const sp = users.find((u) => u.id === s.specialistId);
                  return (
                    <Card key={s.id} style={{ marginBottom: 10, padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: s.notes ? 8 : 0 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{fmtDate(s.date)}</div>
                          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{sp ? sp.name : "—"} · {s.area || "Sin área especificada"}</div>
                          {s.participants && <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 1 }}>{s.participants}</div>}
                        </div>
                      </div>
                      {s.notes && <div style={{ fontSize: 13.5, color: T.inkSoft }}>{s.notes}</div>}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GabinetePanel;
