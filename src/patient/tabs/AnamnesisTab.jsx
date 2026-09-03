import React, { useState } from "react";
import { Plus } from "lucide-react";
import { T, TODAY } from "../../theme.js";
import { fmtDateShort } from "../../lib/format.js";
import { can } from "../../permissions.js";
import { Btn, Card, Section } from "../../ui/index.js";

function AnamnesisTab({ child, documents, users, currentUser, onAddDocument, onUpdateDocument }) {
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: child.name + " " + child.lastName,
    fechaNacimiento: child.birthDate || "",
    edad: "",
    gradoColegio: "",
    acompanante: "",
    telefono: "",
    correo: "",
    motivoConsulta: "",
    antecedentes: "",
    saludActual: "",
    terapiasPrevias: "",
    composicionFamiliar: "",
    hermanos: "",
    situacionPadres: "",
    dinamicaFamiliar: "",
    fortalezas: "",
    dificultades: "",
    relacionPares: "",
    estadoEmocional: "",
    rendimientoAcademico: "",
    areasDificultad: "",
    relacionMaestros: "",
    observaciones: "",
    consentimiento: false,
    firmaAcudiente: "",
    firmaProfesional: "",
    fechaFirma: TODAY,
  });

  const anamnesisDoc = documents.find(d => d.childId === child.id && d.type === "anamnesis" && d.fields?.isForm);
  const canEdit = can(currentUser, "anamnesis:edit");
  const [signLink, setSignLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateSignLink = () => {
    const token = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const baseFields = anamnesisDoc?.fields || { isForm: true, ...form };
    const doc = {
      id: anamnesisDoc?.id || `d-anamnesis-${child.id}`,
      childId: child.id,
      type: "anamnesis",
      title: `Anamnesis — ${child.name} ${child.lastName}`,
      date: anamnesisDoc?.date || TODAY,
      authorId: anamnesisDoc?.authorId || currentUser.id,
      notes: anamnesisDoc?.notes || "",
      fields: { ...baseFields, isForm: true, consentToken: token, consentChildName: `${child.name} ${child.lastName}` },
    };
    if (anamnesisDoc && onUpdateDocument) onUpdateDocument(doc);
    else if (onAddDocument) onAddDocument(doc);
    setLinkCopied(false);
    setSignLink(`${window.location.origin}${window.location.pathname}?firmar=${token}`);
  };

  const copySignLink = () => {
    if (!signLink) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(signLink).then(() => setLinkCopied(true));
    } else {
      setLinkCopied(true);
    }
  };

  const F = ({ label, name, multiline, rows = 3 }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>
      {multiline ? (
        <textarea value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))} rows={rows}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = T.brand} onBlur={e => e.target.style.borderColor = T.border}
        />
      ) : (
        <input value={form[name]} onChange={e => setForm(f => ({...f, [name]: e.target.value}))}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = T.brand} onBlur={e => e.target.style.borderColor = T.border}
        />
      )}
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 500, color: T.brand, borderBottom: `1.5px solid ${T.brand}30`, paddingBottom: 6, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );

  const saveForm = () => {
    const notes = Object.entries(form).filter(([k,v]) => v && k !== "consentimiento").map(([k,v]) => `${k}: ${v}`).join("\n");
    const doc = {
      id: anamnesisDoc?.id || `d-anamnesis-${child.id}`,
      childId: child.id,
      type: "anamnesis",
      title: `Anamnesis — ${child.name} ${child.lastName}`,
      date: TODAY,
      authorId: currentUser.id,
      notes,
      fields: { isForm: true, ...form },
    };
    if (anamnesisDoc && onUpdateDocument) {
      onUpdateDocument(doc);
    } else if (onAddDocument) {
      onAddDocument(doc);
    }
    setShowForm(false);
  };

  // If form data exists, show it filled; else show empty form or existing docs
  const existingDocs = documents.filter(d => d.childId === child.id && d.type === "anamnesis");

  return (
    <div>
      {!showForm && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          {canEdit && (
            <Btn variant="amber" icon={Plus} onClick={() => {
              if (anamnesisDoc?.fields) setForm(f => ({...f, ...anamnesisDoc.fields}));
              setShowForm(true);
            }}>
              {anamnesisDoc ? "Editar anamnesis" : "Completar anamnesis"}
            </Btn>
          )}
        </div>
      )}

      {showForm ? (
        <Card style={{ padding: "20px 24px" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, color: T.ink, marginBottom: 24 }}>
            Anamnesis Breve — {child.name} {child.lastName}
          </div>

          <Section title="Datos generales">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Nombre completo" name="nombre" />
              <F label="Fecha de nacimiento" name="fechaNacimiento" />
              <F label="Edad" name="edad" />
              <F label="Grado escolar / Colegio" name="gradoColegio" />
            </div>
            <F label="Persona acompañante (nombre y parentesco)" name="acompanante" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Teléfono de contacto" name="telefono" />
              <F label="Correo" name="correo" />
            </div>
          </Section>

          <Section title="Motivo de consulta">
            <F label="" name="motivoConsulta" multiline rows={3} />
          </Section>

          <Section title="Antecedentes relevantes">
            <F label="Embarazo, parto y desarrollo temprano (complicaciones, retrasos)" name="antecedentes" multiline rows={3} />
            <F label="Salud actual (enfermedades, alergias, medicamentos)" name="saludActual" multiline rows={2} />
            <F label="Evaluaciones o terapias previas" name="terapiasPrevias" multiline rows={2} />
          </Section>

          <Section title="Información familiar">
            <F label="Composición familiar (con quién vive)" name="composicionFamiliar" multiline rows={2} />
            <F label="Hermanos (nombres y edades)" name="hermanos" />
            <F label="Situación de los padres" name="situacionPadres" />
            <F label="Dinámica familiar relevante" name="dinamicaFamiliar" multiline rows={2} />
          </Section>

          <Section title="Desarrollo y funcionamiento actual">
            <F label="Fortalezas" name="fortalezas" multiline rows={2} />
            <F label="Dificultades observadas (aprendizaje, conducta, social, emocional)" name="dificultades" multiline rows={3} />
            <F label="Relación con pares y adultos" name="relacionPares" multiline rows={2} />
            <F label="Estado emocional (miedos, ánimo, conducta)" name="estadoEmocional" multiline rows={2} />
          </Section>

          <Section title="Escolaridad">
            <F label="Rendimiento académico general" name="rendimientoAcademico" multiline rows={2} />
            <F label="Áreas con mayor dificultad" name="areasDificultad" />
            <F label="Relación con maestros y compañeros" name="relacionMaestros" multiline rows={2} />
          </Section>

          <Section title="Observaciones adicionales">
            <F label="" name="observaciones" multiline rows={3} />
          </Section>

          <Section title="Consentimiento informado">
            <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
              Yo, en calidad de representante legal de <b>{child.name} {child.lastName}</b>, autorizo la evaluación y acompañamiento psicopedagógico/psicosocial.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <F label="Firma acudiente (si firma en persona)" name="firmaAcudiente" />
              <F label="Firma profesional" name="firmaProfesional" />
              <F label="Fecha" name="fechaFirma" />
            </div>
            <div style={{ marginTop: 6, padding: 14, background: T.surfaceSunk, borderRadius: 10 }}>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
                ¿El acudiente no está presente? Genera un link para que firme a distancia desde su celular — la firma queda registrada aquí automáticamente.
              </div>
              <Btn variant="ghost" size="sm" onClick={generateSignLink}>Generar link para firma</Btn>
              {signLink && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input readOnly value={signLink} onFocus={(e) => e.target.select()}
                    style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: "monospace", color: T.ink, background: "#fff" }}
                  />
                  <Btn variant="subtle" size="sm" onClick={copySignLink}>{linkCopied ? "¡Copiado!" : "Copiar"}</Btn>
                </div>
              )}
            </div>
          </Section>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={saveForm}>Guardar anamnesis</Btn>
          </div>
        </Card>
      ) : (
        <div>
          {anamnesisDoc?.fields?.isForm && (
            <Card style={{ padding: "20px 24px" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500, color: T.ink, marginBottom: 16 }}>
                Anamnesis — {child.name} {child.lastName}
              </div>
              {[
                ["Motivo de consulta", anamnesisDoc.fields.motivoConsulta],
                ["Antecedentes", anamnesisDoc.fields.antecedentes],
                ["Salud actual", anamnesisDoc.fields.saludActual],
                ["Composición familiar", anamnesisDoc.fields.composicionFamiliar],
                ["Fortalezas", anamnesisDoc.fields.fortalezas],
                ["Dificultades", anamnesisDoc.fields.dificultades],
                ["Estado emocional", anamnesisDoc.fields.estadoEmocional],
                ["Escolaridad", anamnesisDoc.fields.rendimientoAcademico],
                ["Observaciones", anamnesisDoc.fields.observaciones],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</div>
                </div>
              ))}

              <div style={{ marginTop: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Consentimiento informado</div>
                {anamnesisDoc.fields.firmaAcudienteImg ? (
                  <div>
                    <img src={anamnesisDoc.fields.firmaAcudienteImg} alt="Firma del acudiente" style={{ maxWidth: 300, height: "auto", border: `1px solid ${T.border}`, borderRadius: 8, background: "#fff" }} />
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>
                      Firmado a distancia {anamnesisDoc.fields.fechaFirmaAcudiente ? `el ${fmtDateShort(anamnesisDoc.fields.fechaFirmaAcudiente.slice(0,10))}` : ""}
                    </div>
                  </div>
                ) : anamnesisDoc.fields.firmaAcudiente ? (
                  <div style={{ fontSize: 13.5, color: T.ink }}>Firmado en persona por: <b>{anamnesisDoc.fields.firmaAcudiente}</b> ({anamnesisDoc.fields.fechaFirma})</div>
                ) : (
                  <div style={{ fontSize: 13.5, color: T.inkFaint }}>Aún no se ha registrado la firma del acudiente.</div>
                )}
                {canEdit && !anamnesisDoc.fields.firmaAcudienteImg && (
                  <div style={{ marginTop: 10 }}>
                    <Btn variant="ghost" size="sm" onClick={generateSignLink}>Generar link para firma</Btn>
                    {signLink && (
                      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input readOnly value={signLink} onFocus={(e) => e.target.select()}
                          style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, fontFamily: "monospace", color: T.ink, background: "#fff" }}
                        />
                        <Btn variant="subtle" size="sm" onClick={copySignLink}>{linkCopied ? "¡Copiado!" : "Copiar"}</Btn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
          {existingDocs.filter(d => !d.fields?.isForm).map((d, i) => {
            const author = users.find(u => u.id === d.authorId);
            return (
              <Card key={d.id} style={{ padding: "14px 18px", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>{author?.name} · {fmtDateShort(d.date)}</div>
                {d.notes && <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.notes}</div>}
              </Card>
            );
          })}
          {existingDocs.length === 0 && !anamnesisDoc && (
            <Card style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13.5, color: T.inkFaint }}>Anamnesis no completada aún.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default AnamnesisTab;
