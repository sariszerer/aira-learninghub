import React, { useState, useRef } from "react";
import { T, inputStyle, TODAY } from "../../theme.js";
import { DOC_TYPES } from "../../constants.js";
import { Btn, Modal, ModalHeader, FieldLabel } from "../../ui/index.js";
import { FileText, Upload } from "lucide-react";

function AddDocumentModal({ type, onClose, onSave }) {
  const meta = DOC_TYPES[type] || { label: type, plural: type };
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(TODAY);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("text"); // "text" | "pdf"
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const fileRef = useRef();

  const handlePdf = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setPdfData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const fields = mode === "pdf" && pdfData ? { pdfData, pdfName: pdfFile?.name } : {};
    onSave({ type, title: title.trim(), date, notes: notes.trim(), fields });
  };

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHeader title={`Agregar ${meta.label.toLowerCase()}`} onClose={onClose} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <button onClick={() => setMode("text")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "text" ? T.brand : T.border}`, background: mode === "text" ? `${T.brand}10` : "#fff", color: mode === "text" ? T.brand : T.inkSoft, fontSize: 13, fontWeight: mode === "text" ? 600 : 400, fontFamily: T.font, cursor: "pointer" }}>
            Texto / Notas
          </button>
          <button onClick={() => setMode("pdf")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "pdf" ? T.brand : T.border}`, background: mode === "pdf" ? `${T.brand}10` : "#fff", color: mode === "pdf" ? T.brand : T.inkSoft, fontSize: 13, fontWeight: mode === "pdf" ? 600 : 400, fontFamily: T.font, cursor: "pointer" }}>
            Subir PDF
          </button>
        </div>
        <div>
          <FieldLabel>Título</FieldLabel>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Ej: ${meta.label} inicial`} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <FieldLabel>Fecha</FieldLabel>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
        </div>
        {mode === "text" ? (
          <div>
            <FieldLabel>Contenido</FieldLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
              placeholder="Escribe el contenido, hallazgos u observaciones..."
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6, whiteSpace: "pre-wrap" }} />
          </div>
        ) : (
          <div>
            <FieldLabel>Archivo PDF</FieldLabel>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${pdfFile ? T.brand : T.border}`, borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: pdfFile ? `${T.brand}06` : "#fafafa" }}>
              {pdfFile ? (
                <div>
                  <FileText size={22} color={T.inkFaint} style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.brand }}>{pdfFile.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{(pdfFile.size / 1024).toFixed(0)} KB · Listo para subir</div>
                </div>
              ) : (
                <div>
                  <Upload size={24} color={T.inkFaint} style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 14, color: T.inkSoft }}>Haz clic para seleccionar un PDF</div>
                  <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Evaluaciones, informes, reportes</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdf} />
            {pdfFile && (
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Notas adicionales (opcional)</FieldLabel>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Observaciones sobre el documento..."
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" disabled={!title.trim() || (mode === "pdf" && !pdfFile)} onClick={handleSave}>Guardar</Btn>
      </div>
    </Modal>
  );
}

export default AddDocumentModal;
