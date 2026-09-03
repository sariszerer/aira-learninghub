import React, { useState } from "react";
import { T, CHILD_AVATAR_COLORS, TODAY } from "../theme.js";
import { slugifyName } from "../lib/format.js";
import { ROLES } from "../permissions.js";
import { Btn, Chip, Modal, ModalHeader, Section } from "../ui/index.js";

function AddPatientWizard({ users, currentUser, onClose, onCreate }) {
  const [step, setStep] = useState(1);

  // Step 1 — datos básicos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [admissionDate, setAdmissionDate] = useState(TODAY);
  const [acompanante, setAcompanante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  // Step 2 — anamnesis breve (los mismos campos clínicos que la ficha de Anamnesis)
  const [form, setForm] = useState({
    motivoConsulta: "", antecedentes: "", saludActual: "", terapiasPrevias: "",
    composicionFamiliar: "", hermanos: "", dinamicaFamiliar: "",
    fortalezas: "", dificultades: "", estadoEmocional: "",
    rendimientoAcademico: "", areasDificultad: "", observaciones: "",
  });
  const setField = (name) => (v) => setForm((f) => ({ ...f, [name]: v }));

  // Step 3 — especialistas
  const [assignedSpecialists, setAssignedSpecialists] = useState([]);
  const specialists = users.filter((u) => ROLES[u.role]?.esClinico);
  const toggleSpecialist = (id) => {
    setAssignedSpecialists((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const nombreCompleto = `${nombre} ${apellido}`.trim();
  const step1Valid = nombre.trim() && apellido.trim();

  const F = ({ label, value, onChange, multiline, rows = 3, placeholder, type }) => (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
        />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
        />
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 500, color: T.brand, borderBottom: `1.5px solid ${T.brand}30`, paddingBottom: 6, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );

  const finish = () => {
    const newId = `c-${slugifyName(nombre + apellido)}-${Date.now().toString(36).slice(-5)}`;
    const specialtiesSet = Array.from(new Set(
      assignedSpecialists.map((id) => users.find((u) => u.id === id)?.specialty).filter(Boolean)
    ));
    const child = {
      id: newId, name: nombre.trim(), lastName: apellido.trim(),
      birthDate: birthDate || null, admissionDate: admissionDate || TODAY,
      specialties: specialtiesSet, assignedSpecialists,
      avatarBg: CHILD_AVATAR_COLORS[Math.floor(Math.random() * CHILD_AVATAR_COLORS.length)],
      nextSession: null, nextSessionTime: null,
      parentContact: { name: acompanante, phone: telefono, email: correo },
      packageStart: null, packageNum: 1,
    };
    const fullFields = {
      isForm: true, nombre: nombreCompleto, fechaNacimiento: birthDate, edad: "",
      gradoColegio: "", acompanante, telefono, correo, ...form,
      relacionPares: "", relacionMaestros: "", situacionPadres: "",
      consentimiento: false, firmaAcudiente: "", firmaProfesional: "", fechaFirma: TODAY,
    };
    const notes = Object.entries(fullFields).filter(([k, v]) => v && k !== "consentimiento" && k !== "isForm")
      .map(([k, v]) => `${k}: ${v}`).join("\n");
    const anamnesisDoc = {
      id: `d-anamnesis-${newId}`, childId: newId, type: "anamnesis",
      title: `Anamnesis — ${nombreCompleto}`, date: TODAY, authorId: currentUser.id, notes,
      fields: fullFields,
    };
    onCreate(child, anamnesisDoc);
  };

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHeader
        title="Agregar paciente"
        subtitle={`Paso ${step} de 3 — ${step === 1 ? "Datos del paciente" : step === 2 ? "Anamnesis" : "Asignar especialistas"}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "60vh", overflowY: "auto" }}>

        {step === 1 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Nombre" value={nombre} onChange={setNombre} placeholder="Nombre" />
              <F label="Apellido" value={apellido} onChange={setApellido} placeholder="Apellido" />
              <F label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} type="date" />
              <F label="Fecha de admisión" value={admissionDate} onChange={setAdmissionDate} type="date" />
            </div>
            <F label="Persona acompañante (nombre y parentesco)" value={acompanante} onChange={setAcompanante} placeholder="Ej: María Pérez, madre" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Teléfono de contacto" value={telefono} onChange={setTelefono} />
              <F label="Correo" value={correo} onChange={setCorreo} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 16 }}>
              Ficha de anamnesis breve para <b>{nombreCompleto || "el paciente"}</b>. Puedes completar el resto más adelante desde la ficha del paciente.
            </div>
            <Section title="Motivo de consulta">
              <F value={form.motivoConsulta} onChange={setField("motivoConsulta")} multiline rows={3} />
            </Section>
            <Section title="Antecedentes relevantes">
              <F label="Embarazo, parto y desarrollo temprano" value={form.antecedentes} onChange={setField("antecedentes")} multiline rows={2} />
              <F label="Salud actual (enfermedades, alergias, medicamentos)" value={form.saludActual} onChange={setField("saludActual")} multiline rows={2} />
              <F label="Evaluaciones o terapias previas" value={form.terapiasPrevias} onChange={setField("terapiasPrevias")} multiline rows={2} />
            </Section>
            <Section title="Información familiar">
              <F label="Composición familiar (con quién vive)" value={form.composicionFamiliar} onChange={setField("composicionFamiliar")} multiline rows={2} />
              <F label="Hermanos (nombres y edades)" value={form.hermanos} onChange={setField("hermanos")} />
              <F label="Dinámica familiar relevante" value={form.dinamicaFamiliar} onChange={setField("dinamicaFamiliar")} multiline rows={2} />
            </Section>
            <Section title="Desarrollo y funcionamiento actual">
              <F label="Fortalezas" value={form.fortalezas} onChange={setField("fortalezas")} multiline rows={2} />
              <F label="Dificultades observadas" value={form.dificultades} onChange={setField("dificultades")} multiline rows={2} />
              <F label="Estado emocional" value={form.estadoEmocional} onChange={setField("estadoEmocional")} multiline rows={2} />
            </Section>
            <Section title="Escolaridad">
              <F label="Rendimiento académico general" value={form.rendimientoAcademico} onChange={setField("rendimientoAcademico")} multiline rows={2} />
              <F label="Áreas con mayor dificultad" value={form.areasDificultad} onChange={setField("areasDificultad")} />
            </Section>
            <Section title="Observaciones adicionales">
              <F value={form.observaciones} onChange={setField("observaciones")} multiline rows={2} />
            </Section>
            <div style={{ fontSize: 12.5, color: T.inkFaint, background: T.surfaceSunk, borderRadius: 10, padding: 12 }}>
              El consentimiento informado y la firma del acudiente se completan después, desde la pestaña de Anamnesis del paciente — ahí puedes generar un link para que el acudiente firme desde su celular, aunque no esté presente.
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 14 }}>
              ¿Qué especialistas atenderán a <b>{nombreCompleto || "el paciente"}</b>?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {specialists.map((u) => (
                <Chip key={u.id} label={`${u.name} · ${u.specialty}`} selected={assignedSpecialists.includes(u.id)} onClick={() => toggleSpecialist(u.id)} />
              ))}
            </div>
            {specialists.length === 0 && (
              <div style={{ fontSize: 13.5, color: T.inkFaint }}>No hay especialistas registrados todavía.</div>
            )}
          </div>
        )}

      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", padding: "16px 24px", borderTop: `1px solid ${T.border}` }}>
        <Btn variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}>
          {step === 1 ? "Cancelar" : "Atrás"}
        </Btn>
        {step < 3 ? (
          <Btn variant="primary" disabled={step === 1 && !step1Valid} onClick={() => setStep((s) => s + 1)}>Siguiente</Btn>
        ) : (
          <Btn variant="primary" onClick={finish}>Guardar paciente</Btn>
        )}
      </div>
    </Modal>
  );
}

export default AddPatientWizard;
