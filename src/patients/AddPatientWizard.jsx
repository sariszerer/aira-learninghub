import React, { useState } from "react";
import { T, CHILD_AVATAR_COLORS, TODAY, inputStyle } from "../theme.js";
import { slugifyName } from "../lib/format.js";
import { ROLES } from "../permissions.js";
import { Btn, Chip, Modal, ModalHeader } from "../ui/index.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";
import { TIPOS } from "../lib/expediente.js";

function AddPatientWizard({ users, currentUser, ninos = [], onClose, onCreate }) {
  const [step, setStep] = useState(1);

  // Niño o madre/padre de Pautas de Crianza. Cambia qué se pregunta y qué se
  // guarda: a una madre no se le hace anamnesis del desarrollo.
  const [tipo, setTipo] = useState("nino");
  const [acudienteDe, setAcudienteDe] = useState("");
  const esAcud = tipo === "acudiente";

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
  // Avanzar de paso también es guardar algo, y el botón apagado no decía qué
  // faltaba. Con el alta en tres pasos, el campo vacío puede quedar arriba y
  // fuera de la vista.
  const siguientePaso = () => {
    const falta = step === 1 ? queFalta([
      [!!nombre.trim(), "el nombre"],
      [!!apellido.trim(), "el apellido"],
    ]) : null;
    if (falta) { avisar.error(falta); return; }
    // El acudiente se salta la anamnesis: pasa del paso 1 al 3.
    setStep((s) => (esAcud && s === 1 ? 3 : s + 1));
  };



  const finish = () => {
    const newId = `c-${slugifyName(nombre + apellido)}-${Date.now().toString(36).slice(-5)}`;
    const specialtiesSet = Array.from(new Set(
      assignedSpecialists.map((id) => users.find((u) => u.id === id)?.specialty).filter(Boolean)
    ));
    const child = {
      id: newId, name: nombre.trim(), lastName: apellido.trim(),
      tipo, acudienteDe: esAcud ? (acudienteDe || null) : null,
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
    // A una madre no se le abre anamnesis del desarrollo: no es su expediente
    // clínico infantil, y un documento vacío con ese título confunde.
    onCreate(child, esAcud ? null : anamnesisDoc);
  };

  return (
    <Modal onClose={onClose} width={640}>
      <ModalHeader
        title="Agregar paciente"
        subtitle={esAcud
          ? `${step === 1 ? "Datos" : "Asignar especialistas"} — Pautas de Crianza`
          : `Paso ${step} de 3 — ${step === 1 ? "Datos del paciente" : step === 2 ? "Anamnesis" : "Asignar especialistas"}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "60vh", overflowY: "auto" }}>

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 700, color: T.inkFaint, marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                Tipo de expediente
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {Object.entries(TIPOS).map(([clave, t]) => (
                  <Chip
                    key={clave} label={t.label} selected={tipo === clave}
                    onClick={() => setTipo(clave)}
                  />
                ))}
              </div>
              {esAcud && (
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 7, lineHeight: 1.5 }}>
                  Expediente de Pautas de Crianza: plan de trabajo, sesiones y objetivos.
                  Sin anamnesis del desarrollo ni reportes para la familia.
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Nombre" value={nombre} onChange={setNombre} placeholder="Nombre" />
              <F label="Apellido" value={apellido} onChange={setApellido} placeholder="Apellido" />
              {/* A una madre no se le pide fecha de nacimiento: no hay hitos del
                  desarrollo que fechar y el dato no se usa en ninguna parte. */}
              {!esAcud && (
                <F label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} type="date" />
              )}
              <F label="Fecha de admisión" value={admissionDate} onChange={setAdmissionDate} type="date" />
            </div>

            {esAcud ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: T.inkFaint, marginBottom: 5,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Hijo o hija en el centro
                </div>
                <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 7 }}>
                  Opcional: también se atiende a familias cuyo hijo no es paciente aquí.
                </div>
                <select
                  value={acudienteDe} onChange={(e) => setAcudienteDe(e.target.value)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Sin hijo o hija en el centro</option>
                  {ninos.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>
                  ))}
                </select>
              </div>
            ) : (
              <F label="Persona acompañante (nombre y parentesco)" value={acompanante} onChange={setAcompanante} placeholder="Ej: María Pérez, madre" />
            )}
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
            <SeccionAlta title="Motivo de consulta">
              <F value={form.motivoConsulta} onChange={setField("motivoConsulta")} multiline rows={3} />
            </SeccionAlta>
            <SeccionAlta title="Antecedentes relevantes">
              <F label="Embarazo, parto y desarrollo temprano" value={form.antecedentes} onChange={setField("antecedentes")} multiline rows={2} />
              <F label="Salud actual (enfermedades, alergias, medicamentos)" value={form.saludActual} onChange={setField("saludActual")} multiline rows={2} />
              <F label="Evaluaciones o terapias previas" value={form.terapiasPrevias} onChange={setField("terapiasPrevias")} multiline rows={2} />
            </SeccionAlta>
            <SeccionAlta title="Información familiar">
              <F label="Composición familiar (con quién vive)" value={form.composicionFamiliar} onChange={setField("composicionFamiliar")} multiline rows={2} />
              <F label="Hermanos (nombres y edades)" value={form.hermanos} onChange={setField("hermanos")} />
              <F label="Dinámica familiar relevante" value={form.dinamicaFamiliar} onChange={setField("dinamicaFamiliar")} multiline rows={2} />
            </SeccionAlta>
            <SeccionAlta title="Desarrollo y funcionamiento actual">
              <F label="Fortalezas" value={form.fortalezas} onChange={setField("fortalezas")} multiline rows={2} />
              <F label="Dificultades observadas" value={form.dificultades} onChange={setField("dificultades")} multiline rows={2} />
              <F label="Estado emocional" value={form.estadoEmocional} onChange={setField("estadoEmocional")} multiline rows={2} />
            </SeccionAlta>
            <SeccionAlta title="Escolaridad">
              <F label="Rendimiento académico general" value={form.rendimientoAcademico} onChange={setField("rendimientoAcademico")} multiline rows={2} />
              <F label="Áreas con mayor dificultad" value={form.areasDificultad} onChange={setField("areasDificultad")} />
            </SeccionAlta>
            <SeccionAlta title="Observaciones adicionales">
              <F value={form.observaciones} onChange={setField("observaciones")} multiline rows={2} />
            </SeccionAlta>
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
        <Btn variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => (esAcud && s === 3 ? 1 : s - 1))}>
          {step === 1 ? "Cancelar" : "Atrás"}
        </Btn>
        {step < 3 ? (
          <Btn variant="primary" onClick={siguientePaso}>Siguiente</Btn>
        ) : (
          <Btn variant="primary" onClick={finish}>Guardar paciente</Btn>
        )}
      </div>
    </Modal>
  );
}

export default AddPatientWizard;

// Definidos FUERA del componente a proposito.
//
// Estaban dentro, y eso los convertia en un TIPO de componente nuevo en cada
// render: React desmontaba el input y montaba otro, asi que el campo perdia el
// foco despues de cada tecla y habia que volver a hacer clic para escribir la
// siguiente letra. Con formularios de veinte campos, imposible de usar.
function F({ label, value, onChange, multiline, rows = 3, placeholder, type }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
        />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
        />
      )}
    </div>
  );
}

function SeccionAlta({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.brand, borderBottom: `1.5px solid ${T.brand}30`, paddingBottom: 6, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
