import React, { useState } from "react";
import { T } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn } from "../ui/index.js";

// Modal de edicion del perfil del paciente. Estaba en linea dentro de
// ChildProfile, que ya cargaba con el encabezado, los tabs y su enrutado.
function EditProfileModal({ child, onClose }) {
  const onUpdateChild = useDataStore((s) => s.updateChild);
  const [editForm, setEditForm] = useState({
    name: child.name, lastName: child.lastName,
    birthDate: child.birthDate || "", admissionDate: child.admissionDate || "",
    parentName: child.parentContact?.name || "",
    parentPhone: child.parentContact?.phone || "",
    parentEmail: child.parentContact?.email || "",
  });

  const handleSaveProfile = () => {
    onUpdateChild(child.id, {
      name: editForm.name.trim(),
      lastName: editForm.lastName.trim(),
      birthDate: editForm.birthDate || null,
      admissionDate: editForm.admissionDate || null,
      parentContact: { name: editForm.parentName, phone: editForm.parentPhone, email: editForm.parentEmail },
    });
    onClose();
  };

  return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color: T.ink, marginBottom: 24 }}>
              Editar perfil
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Nombre", key: "name" },
                { label: "Apellido", key: "lastName" },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[
                { label: "Fecha de nacimiento", key: "birthDate", type: "date" },
                { label: "Fecha de ingreso", key: "admissionDate", type: "date" },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input type={type} value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del padre/madre</div>
              <input value={editForm.parentName} onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.brand}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 24 }}>
              {[
                { label: "Teléfono", key: "parentPhone" },
                { label: "Email", key: "parentEmail" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = T.brand}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingProfile(false)} style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 14, fontFamily: T.font, cursor: "pointer" }}>
                Cancelar
              </button>
              <Btn onClick={handleSaveProfile} disabled={!editForm.name.trim() || !editForm.lastName.trim()}>Guardar cambios</Btn>
            </div>
          </div>
        </div>
  );
}

export default EditProfileModal;
