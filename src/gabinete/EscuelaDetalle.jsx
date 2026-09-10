import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import { T, TODAY } from "../theme.js";
import { fmtDate, contar } from "../lib/format.js";
import { can, ROLES } from "../permissions.js";
import { Avatar, Btn, Card, Eyebrow, IconBtn, Tabs } from "../ui/index.js";
import { useDataStore } from "../store/dataStore.js";
import { useEsMovil, paddingPagina } from "../lib/pantalla.js";
import { useAuthStore } from "../store/authStore.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";
import AddDocumentModal from "../patient/modals/AddDocumentModal.jsx";
import { DOC_TYPES_GABINETE } from "../constants.js";
import EstudianteModal from "./EstudianteModal.jsx";
import ExpedienteEstudiante from "./ExpedienteEstudiante.jsx";
import PanelPreescolar from "./PanelPreescolar.jsx";
import TerapeutaModal from "./TerapeutaModal.jsx";
import { terapeutasDeColegio, aQuienAcompana } from "./terapeutas.js";
import CargandoAira from "../ui/CargandoAira.jsx";

// Ficha completa de un colegio del gabinete: /gabinete/:schoolId
//
// Antes vivia apretada en una columna al lado de la lista de escuelas, con 260px
// robados a un contenido que son tres bloques anchos — terapeutas, estudiantes y
// documentos. Sacarla a su propia ruta le devuelve el ancho, y de paso hace que
// la escuela abierta se pueda enlazar, marcar y volver atras con el navegador.
// Las cuatro pestanas, con estudiantes primero: es a lo que se entra. Los ids
// son tambien el ?tab= de la URL, asi que una pestana concreta se puede enlazar.
const PESTANAS_TUTORIA = [
  { id: "estudiantes", label: "Estudiantes" },
  { id: "terapeutas",  label: "Terapeutas" },
  { id: "documentos",  label: "Documentos" },
  { id: "sesiones",    label: "Sesiones" },
];
const POR_DEFECTO = "estudiantes";

export default function EscuelaDetalle({ onAddSession }) {
  const esMovil = useEsMovil();
  const { schoolId } = useParams();
  const navegar = useNavigate();

  const [parametros, setParametros] = useSearchParams();
  const pedida = parametros.get("tab");
  const tab = PESTANAS_TUTORIA.some((t) => t.id === pedida) ? pedida : POR_DEFECTO;
  const setTab = (id) => {
    const siguiente = new URLSearchParams(parametros);
    // La de por defecto se queda fuera de la URL, para no ensuciarla.
    if (id === POR_DEFECTO) siguiente.delete("tab");
    else siguiente.set("tab", id);
    // replace: el boton de atras vuelve al listado, no recorre las pestanas.
    setParametros(siguiente, { replace: true });
  };

  const schools = useDataStore((s) => s.schools);
  const users = useDataStore((s) => s.users);
  const documents = useDataStore((s) => s.documents);
  const gabineteSessions = useDataStore((s) => s.gabineteSessions);
  const estudiantesGabinete = useDataStore((s) => s.estudiantesGabinete);
  const tutores = useDataStore((s) => s.tutores);
  const dataLoaded = useDataStore((s) => s.dataLoaded);
  const borrarColegio = useDataStore((s) => s.borrarColegio);
  const agregarDocumentoDeColegio = useDataStore((s) => s.agregarDocumentoDeColegio);
  const guardarEstudiante = useDataStore((s) => s.guardarEstudianteGabinete);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [subiendo, setSubiendo] = useState(null);
  const [errorColegio, setErrorColegio] = useState(null);
  const [editandoEstudiante, setEditandoEstudiante] = useState(null);
  const [editandoTerapeuta, setEditandoTerapeuta] = useState(null);
  const [viendoExpediente, setViendoExpediente] = useState(null);
  const [sessionForm, setSessionForm] = useState(null);

  const school = schools.find((s) => s.id === schoolId) || null;

  const allSpecialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const emptySession = () => ({ specialistId: "", specialty: "", date: TODAY, participants: "", duration: 60, area: "", notes: "" });

  const handleSaveSession = () => {
    const falta = queFalta([
      [!!sessionForm.date, "la fecha"],
      [!!sessionForm.specialistId, "quién impartió la sesión"],
    ]);
    if (falta) { avisar.error(falta); return; }
    // La especialidad no se pide en el formulario y se guardaba vacia: sale de
    // quien imparte, que si se elige.
    const especialidad = allSpecialists.find((u) => u.id === sessionForm.specialistId)?.specialty || "";
    onAddSession({ id: `gs-${Date.now()}`, schoolId: school.id, ...sessionForm, specialty: especialidad });
    setSessionForm(null);
  };

  // Se distingue "todavia no han llegado los datos" de "esta escuela no existe".
  // Sin eso, entrar por un enlace directo enseñaba "no encontrada" durante el
  // segundo que tarda la carga.
  if (!school) {
    if (!dataLoaded) {
      return (
        <div style={{ padding: "60px 28px", display: "flex", justifyContent: "center" }}>
          <CargandoAira />
        </div>
      );
    }
    return (
      <div style={{ padding: paddingPagina(esMovil) }}>
        <Volver onClick={() => navegar("/gabinete")} />
        <Card style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.inkSoft, marginBottom: 6 }}>
            Esta escuela ya no existe
          </div>
          <div style={{ fontSize: 13.5, color: T.inkFaint }}>
            Puede que se haya eliminado. Vuelve al listado de gabinete.
          </div>
        </Card>
      </div>
    );
  }

  const schoolSessions = gabineteSessions
    .filter((s) => s.schoolId === school.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const delColegio = estudiantesGabinete.filter((e) => e.schoolId === school.id);
  const esTutoria = (school.programa || "tutoria") === "tutoria";
  const terapeutas = terapeutasDeColegio(tutores, estudiantesGabinete, school.id);

  return (
    <div style={{ padding: paddingPagina(esMovil) }}>
      <Volver onClick={() => navegar("/gabinete")} />
      {/* Expediente de un estudiante: ocupa el detalle entero. Verlo en un
          modal sobre la escuela escondia justo lo que se va a leer. */}
      {viendoExpediente ? (
        <ExpedienteEstudiante
          estudiante={estudiantesGabinete.find((e) => e.id === viendoExpediente) || viendoExpediente}
          programa={school.programa || "tutoria"}
          onVolver={() => setViendoExpediente(null)}
        />
      ) : (
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
                        avisar.error("No se pudo eliminar el colegio", e);
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: esMovil ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
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


          {/* En preescolar la primera pestana no lista estudiantes con tutor:
              los organiza por nivel PanelPreescolar, que es otro programa. */}
          <Tabs
            tabs={PESTANAS_TUTORIA.map((t) =>
              t.id === "estudiantes" && !esTutoria ? { ...t, label: "Niveles" } : t)}
            activo={tab}
            onCambiar={setTab}
          />

          {tab === "estudiantes" && (
            <>
              {!esTutoria && (
                <div style={{ marginBottom: 22 }}>
                  <PanelPreescolar
                    school={school}
                    onAbrirEstudiante={setViendoExpediente}
                    onNuevoEstudiante={() => setEditandoEstudiante({ nuevo: true })}
                  />
                </div>
              )}

              {/* Estudiantes con tutor. Solo en el programa de tutoria: el de
                  preescolar se organiza por nivel y lo pinta PanelPreescolar. */}
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
            </>
          )}

          {/* Terapeutas contratados. La lista crece con el programa: AIRA coloca
              una por nino, y cuando el centro contrata otro caso entra otra.
              Debajo de cada una, a quien acompana. */}
          {tab === "terapeutas" && (
            <Card style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: terapeutas.length ? 14 : 0 }}>
                <div>
                  <Eyebrow>Terapeutas contratados</Eyebrow>
                  <div style={{ fontSize: 12.5, color: T.inkFaint, marginTop: 3 }}>
                    {terapeutas.length
                      ? contar(terapeutas.length, "terapeuta en este centro", "terapeutas en este centro")
                      : "Todavia no hay ninguna"}
                  </div>
                </div>
                {can(currentUser, "gabinete:session:create") && (
                  <Btn size="sm" variant="secondary" icon={Plus} onClick={() => setEditandoTerapeuta({ nueva: true })}>
                    Agregar terapeuta
                  </Btn>
                )}
              </div>

              {terapeutas.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {terapeutas.map((t) => {
                    const sinAsignar = t.acompana.length === 0;
                    return (
                      <button
                        key={t.id} type="button"
                        onClick={() => setEditandoTerapeuta(t)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, width: "100%",
                          padding: "11px 13px", borderRadius: 10, cursor: "pointer",
                          textAlign: "left", fontFamily: T.font,
                          border: `1px solid ${T.border}`, background: T.surface,
                        }}
                      >
                        <Avatar name={t.name} bg={t.avatarBg} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{t.name}</div>
                          <div style={{
                            fontSize: 12.5, marginTop: 2,
                            color: sinAsignar ? T.apoyo : T.inkSoft,
                            fontStyle: sinAsignar ? "italic" : "normal",
                          }}>
                            {aQuienAcompana(t.acompana)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end", fontSize: 12, color: T.inkFaint }}>
                          {t.cedula && <span>{t.cedula}</span>}
                          {t.telefono && <span>{t.telefono}</span>}
                          {!t.userId && (
                            <span style={{ color: T.proceso, fontWeight: 600 }}>Sin cuenta</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Documentos del colegio. Cuelgan del contrato, no de un paciente:
              son el expediente del gabinete con esa escuela. */}
          {tab === "documentos" && (
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
          )}

          {tab === "sesiones" && (
            <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <Eyebrow>Sesiones de gabinete</Eyebrow>
                  {/* Llamaba a setAddingSession, un setter que no existe en
                      este componente: pulsarlo lanzaba un ReferenceError en vez
                      de abrir el formulario. emptySession ya estaba escrito y
                      sin usar. */}
                  {can(currentUser, "gabinete:session:create") && (
                    <Btn icon={Plus} onClick={() => setSessionForm(emptySession())}>Registrar sesión</Btn>
                  )}
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
                      <Btn onClick={handleSaveSession}>Guardar sesión</Btn>
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
            </>
          )}

          {/* Los modales viven fuera de las pestanas: cambiar de pestana con uno
              abierto lo cerraria de golpe y se perderia lo escrito. */}
          {editandoEstudiante && (
            <EstudianteModal
              estudiante={editandoEstudiante.nuevo ? null : editandoEstudiante}
              schoolId={school.id}
              programa={school.programa || "tutoria"}
              onClose={() => setEditandoEstudiante(null)}
              onGuardar={guardarEstudiante}
            />
          )}

          {editandoTerapeuta && (
            <TerapeutaModal
              terapeuta={editandoTerapeuta.nueva ? null : editandoTerapeuta}
              schoolId={school.id}
              onClose={() => setEditandoTerapeuta(null)}
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
        </div>
      )}
    </div>
  );
}

function Volver({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, background: "none",
        border: "none", cursor: "pointer", padding: "0 0 14px",
        fontFamily: T.font, fontSize: 13, color: T.brand, fontWeight: 600,
      }}
    >
      <ArrowLeft size={15} /> Volver a Gabinete
    </button>
  );
}
