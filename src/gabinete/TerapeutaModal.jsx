import React, { useMemo, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { T, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { avisar } from "../store/avisosStore.js";
import { queFalta } from "../lib/validacion.js";
import { Btn, Chip, Modal, ModalHeader } from "../ui/index.js";

// Alta y edición de una terapeuta contratada para un colegio.
//
// Es la misma fila que acompaña a los estudiantes (tutors): no hay una entidad
// "especialista del colegio" aparte. Por eso desde aquí se ven y se cambian sus
// datos de contacto, la cuenta AIRA con la que entra al sistema, y su contrato.

const PESO_MAXIMO = 4 * 1024 * 1024;

export default function TerapeutaModal({ terapeuta, schoolId, onClose }) {
  const nueva = !terapeuta?.id;
  const guardarTutor = useDataStore((s) => s.guardarTutor);
  const agregarDocumento = useDataStore((s) => s.agregarDocumentoDeTerapeuta);
  const documents = useDataStore((s) => s.documents);
  const users = useDataStore((s) => s.users);

  const [f, setF] = useState({
    name: terapeuta?.name || "",
    cedula: terapeuta?.cedula || "",
    telefono: terapeuta?.telefono || "",
    email: terapeuta?.email || "",
    startDate: terapeuta?.startDate || "",
    userId: terapeuta?.userId || "",
  });
  const [contrato, setContrato] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const entrada = useRef(null);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const contratos = useMemo(
    () => documents.filter((d) => d.tutorId && d.tutorId === terapeuta?.id && d.type === "contrato"),
    [documents, terapeuta?.id]
  );

  // Cuentas con rol de tutora. Enlazarla es lo que le abre el expediente de su
  // estudiante, y solo el suyo.
  const cuentas = useMemo(
    () => users.filter((u) => u.role === "shadow" && u.activo !== false)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const elegirContrato = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const problema =
      archivo.type !== "application/pdf" ? "El contrato tiene que ser un PDF."
      : archivo.size > PESO_MAXIMO ? "El PDF pesa más de 4 MB. Comprímelo antes de subirlo."
      : null;
    if (problema) { avisar.error("No se pudo adjuntar el contrato", problema); return; }
    const lector = new FileReader();
    lector.onload = () => setContrato({ nombre: archivo.name, datos: lector.result });
    lector.readAsDataURL(archivo);
  };

  const guardar = async () => {
    const falta = queFalta([[!!f.name.trim(), "el nombre de la terapeuta"]]);
    if (falta) { avisar.error(falta); return; }
    setGuardando(true);
    try {
      const fila = await guardarTutor({
        ...terapeuta,
        name: f.name.trim(),
        cedula: f.cedula.trim() || null,
        telefono: f.telefono.trim() || null,
        email: f.email.trim() || null,
        startDate: f.startDate || null,
        userId: f.userId || null,
        schoolId,
        role: terapeuta?.role || "shadow",
      });
      // El contrato va después y solo si la terapeuta se guardó: adjuntarlo
      // antes lo dejaría huérfano si el alta falla.
      if (contrato) {
        await agregarDocumento(fila.id, {
          type: "contrato",
          title: `Contrato firmado — ${f.name.trim()}`,
          date: f.startDate || null,
          notes: "",
          fields: { modo: "pdf", pdfNombre: contrato.nombre, pdfDatos: contrato.datos },
        });
      }
      avisar.exito(nueva ? `${f.name.trim()} agregada al colegio` : "Terapeuta actualizada");
      onClose();
    } catch {
      // El store ya publicó el error por el canal de avisos.
      setGuardando(false);
    }
  };

  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader
        title={nueva ? "Nueva terapeuta contratada" : "Terapeuta contratada"}
        subtitle={nueva ? "Se suma al colegio" : terapeuta.name}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "68vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Campo etiqueta="Nombre completo">
          <input value={f.name} onChange={(e) => set("name", e.target.value)} style={campoTexto} />
        </Campo>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Campo etiqueta="Cédula">
            <input value={f.cedula} onChange={(e) => set("cedula", e.target.value)} placeholder="8-123-4567" style={campoTexto} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input value={f.telefono} onChange={(e) => set("telefono", e.target.value)} style={campoTexto} />
          </Campo>
          <Campo etiqueta="Correo electrónico">
            <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={campoTexto} />
          </Campo>
          <Campo etiqueta="Desde">
            <input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} style={campoTexto} />
          </Campo>
        </div>

        <Campo
          etiqueta="Cuenta AIRA"
          ayuda="Con esto entra al sistema y ve el expediente de su estudiante. Solo el suyo."
        >
          {cuentas.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.inkFaint }}>
              No hay cuentas con rol Tutor AIRA. Se crean en Equipo.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cuentas.map((u) => (
                <Chip
                  key={u.id} label={u.name} selected={f.userId === u.id}
                  onClick={() => set("userId", f.userId === u.id ? "" : u.id)}
                />
              ))}
            </div>
          )}
        </Campo>

        <Campo etiqueta="Contrato firmado">
          {contratos.length > 0 && !contrato && (
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 7 }}>
              Ya hay {contratos.length === 1 ? "un contrato guardado" : `${contratos.length} contratos guardados`}.
              Subir otro no reemplaza el anterior.
            </div>
          )}
          <button
            type="button" onClick={() => entrada.current?.click()}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "11px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: `1px dashed ${contrato ? T.brand : T.border}`,
              background: contrato ? T.brandTint : T.surface,
              fontFamily: T.font, fontSize: 13, color: contrato ? T.brand : T.inkSoft,
            }}
          >
            <Paperclip size={14} />
            {contrato ? `${contrato.nombre} — pulsa para cambiarlo` : "Elegir el PDF del contrato firmado"}
          </button>
          <input ref={entrada} type="file" accept="application/pdf" onChange={elegirContrato} style={{ display: "none" }} />
        </Campo>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : nueva ? "Agregar terapeuta" : "Guardar"}
        </Btn>
      </div>
    </Modal>
  );
}

const campoTexto = { ...inputStyle, width: "100%", boxSizing: "border-box" };

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5,
      }}>
        {etiqueta}
      </div>
      {ayuda && <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 6 }}>{ayuda}</div>}
      {children}
    </div>
  );
}
