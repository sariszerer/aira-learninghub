import React, { useState } from "react";
import { T, TODAY } from "../theme.js";
import { fmtDate } from "../lib/format.js";
import { ROLES } from "../permissions.js";
import { Eyebrow, Card, Chip } from "../ui/index.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn } from "../ui/index.js";
import { Plus } from "lucide-react";

function GabinetePanel({ onAddSession }) {
  const schools = useDataStore((s) => s.schools);
  const users = useDataStore((s) => s.users);
  const gabineteSessions = useDataStore((s) => s.gabineteSessions);
  const onAddSchool = useDataStore((s) => s.addSchool);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [addingSchool, setAddingSchool] = useState(false);
  const [sessionForm, setSessionForm] = useState(null);
  const [newSchool, setNewSchool] = useState({ name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "", specialty: "", assignedSpecialists: [], notes: "" });

  const school = schools.find((s) => s.id === selectedSchool) || schools[0] || null;
  const schoolSessions = school ? gabineteSessions.filter((s) => s.schoolId === school.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  const allSpecialists = users.filter((u) => ROLES[u.role]?.esClinico);

  const emptySession = () => ({ specialistId: "", specialty: "", date: TODAY, participants: "", duration: 60, area: "", notes: "" });

  const handleSaveSession = () => {
    onAddSession({ id: `gs-${Date.now()}`, schoolId: school.id, ...sessionForm });
    setSessionForm(null);
  };

  const handleSaveSchool = () => {
    onAddSchool({ id: `sch-${Date.now()}`, ...newSchool, students: [] });
    setAddingSchool(false);
    setNewSchool({ name: "", contact: "", phone: "", email: "", contractStart: "", contractEnd: "", specialty: "", assignedSpecialists: [], notes: "" });
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
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏫</div>
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

          {/* School detail */}
          {school && (
            <div>
              <Card style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color: T.ink }}>{school.name}</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3 }}>{school.contact}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {school.phone && <a href={`tel:${school.phone}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>📞 {school.phone}</a>}
                    {school.email && <a href={`mailto:${school.email}`} style={{ fontSize: 12.5, color: T.brand, textDecoration: "none", fontWeight: 600 }}>✉ {school.email}</a>}
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
              </Card>

              {/* Sessions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <Eyebrow>Sesiones de gabinete</Eyebrow>
                <Btn icon={Plus} onClick={() => setAddingSession(true)}>Registrar sesión</Btn>
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
