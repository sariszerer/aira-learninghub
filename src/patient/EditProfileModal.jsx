import React, { useState } from "react";
import { T, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, Modal, ModalHeader } from "../ui/index.js";

// Modal de edicion del perfil del paciente.
//
// Se reescribio sobre las primitivas compartidas (Modal, ModalHeader, Btn): la
// version anterior dibujaba a mano su propio fondo y sus propios botones, y el
// de Cancelar llamaba a setEditingProfile — un setter que existia cuando esto
// vivia dentro de ChildProfile y que aqui no esta definido. Pulsarlo lanzaba un
// ReferenceError en vez de cerrar.
//
// Los campos nuevos son los que pide Formatos_Reportes_AIRA.docx en el
// encabezado de los tres reportes y en "Datos de identificacion" y "Estado
// actual" del Historial Clinico.

const ESTADOS = [
  { valor: "activo", label: "Activo" },
  { valor: "pausa", label: "En pausa" },
  { valor: "alta", label: "De alta" },
];

export default function EditProfileModal({ child, onClose }) {
  const onUpdateChild = useDataStore((s) => s.updateChild);
  const [f, setF] = useState({
    name: child.name || "",
    lastName: child.lastName || "",
    recordNo: child.recordNo || "",
    birthDate: child.birthDate || "",
    admissionDate: child.admissionDate || "",
    school: child.school || "",
    referralReason: child.referralReason || "",
    status: child.status === "inactivo" ? "pausa" : child.status || "activo",
    dischargeDate: child.dischargeDate || "",
    dischargeReason: child.dischargeReason || "",
    parentName: child.parentContact?.name || "",
    parentPhone: child.parentContact?.phone || "",
    parentEmail: child.parentContact?.email || "",
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const guardar = () => {
    onUpdateChild(child.id, {
      name: f.name.trim(),
      lastName: f.lastName.trim(),
      recordNo: f.recordNo.trim() || null,
      birthDate: f.birthDate || null,
      admissionDate: f.admissionDate || null,
      school: f.school.trim() || null,
      referralReason: f.referralReason.trim() || null,
      status: f.status,
      // Los campos de alta solo se guardan si el estado es "de alta": dejar una
      // fecha de alta en un paciente activo saldria en el Historial como una
      // contradiccion.
      dischargeDate: f.status === "alta" ? f.dischargeDate || null : null,
      dischargeReason: f.status === "alta" ? f.dischargeReason.trim() || null : null,
      parentContact: { name: f.parentName, phone: f.parentPhone, email: f.parentEmail },
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={620}>
      <ModalHeader
        title="Editar perfil"
        subtitle={`${child.name} ${child.lastName}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <Grupo>
          <Campo etiqueta="Nombre">
            <Texto valor={f.name} onChange={(v) => set("name", v)} />
          </Campo>
          <Campo etiqueta="Apellido">
            <Texto valor={f.lastName} onChange={(v) => set("lastName", v)} />
          </Campo>
        </Grupo>

        <Grupo>
          <Campo etiqueta="N° de expediente" ayuda="Aparece en el encabezado de los tres reportes">
            <Texto valor={f.recordNo} onChange={(v) => set("recordNo", v)} placeholder="AIRA-0000" />
          </Campo>
          <Campo etiqueta="Colegio">
            <Texto valor={f.school} onChange={(v) => set("school", v)} />
          </Campo>
        </Grupo>

        <Grupo>
          <Campo etiqueta="Fecha de nacimiento">
            <Texto tipo="date" valor={f.birthDate} onChange={(v) => set("birthDate", v)} />
          </Campo>
          <Campo etiqueta="Fecha de ingreso">
            <Texto tipo="date" valor={f.admissionDate} onChange={(v) => set("admissionDate", v)} />
          </Campo>
        </Grupo>

        <Campo etiqueta="Motivo de consulta inicial" ayuda="Por qué llegó a AIRA. Va en el Historial Clínico.">
          <textarea
            value={f.referralReason} onChange={(e) => set("referralReason", e.target.value)} rows={2}
            placeholder="Ej: retraso en la adquisición del lenguaje expresivo reportado por el colegio."
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
          />
        </Campo>

        <Campo etiqueta="Estado del proceso">
          <div style={{ display: "flex", gap: 6 }}>
            {ESTADOS.map((e) => {
              const sel = f.status === e.valor;
              return (
                <button
                  key={e.valor} type="button" onClick={() => set("status", e.valor)}
                  style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer",
                    fontFamily: T.font, fontSize: 12.5, fontWeight: sel ? 700 : 400,
                    border: `1.5px solid ${sel ? T.brand : T.border}`,
                    background: sel ? T.brandTint : T.surface,
                    color: sel ? T.brand : T.inkSoft,
                  }}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
        </Campo>

        {f.status === "alta" && (
          <>
            <Campo etiqueta="Fecha de alta">
              <Texto tipo="date" valor={f.dischargeDate} onChange={(v) => set("dischargeDate", v)} />
            </Campo>
            <Campo etiqueta="Motivo del alta y seguimiento">
              <textarea
                value={f.dischargeReason} onChange={(e) => set("dischargeReason", e.target.value)} rows={2}
                placeholder="Motivo del alta y recomendaciones de seguimiento."
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
              />
            </Campo>
          </>
        )}

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <Campo etiqueta="Nombre del padre / madre / tutor">
            <Texto valor={f.parentName} onChange={(v) => set("parentName", v)} />
          </Campo>
          <div style={{ height: 14 }} />
          <Grupo>
            <Campo etiqueta="Teléfono">
              <Texto valor={f.parentPhone} onChange={(v) => set("parentPhone", v)} />
            </Campo>
            <Campo etiqueta="Correo">
              <Texto tipo="email" valor={f.parentEmail} onChange={(v) => set("parentEmail", v)} />
            </Campo>
          </Grupo>
        </div>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={!f.name.trim() || !f.lastName.trim()}>Guardar cambios</Btn>
      </div>
    </Modal>
  );
}

function Grupo({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5,
      }}>
        {etiqueta}
      </div>
      {ayuda && <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 5 }}>{ayuda}</div>}
      {children}
    </div>
  );
}

function Texto({ valor, onChange, tipo = "text", placeholder }) {
  return (
    <input
      type={tipo} value={valor} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
    />
  );
}
