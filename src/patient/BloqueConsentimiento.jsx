import React, { useState } from "react";
import { Check, Clock, Link2, ShieldAlert, Trash2 } from "lucide-react";
import { T, TODAY, inputStyle } from "../theme.js";
import { fmtDateShort } from "../lib/format.js";
import { Btn, Card } from "../ui/index.js";
import { avisar } from "../store/avisosStore.js";
import { textoConsentimiento } from "../lib/expediente.js";
import {
  TIPO, idDeConsentimiento, documentoDeConsentimiento, estadoDeConsentimiento,
  nuevoToken, enlaceDeFirma, sinFirma,
} from "../lib/consentimiento.js";

// El consentimiento informado de este expediente.
//
// Estaba dentro del formulario de anamnesis, así que solo se podía pedir si la
// anamnesis se había llenado EN la plataforma. La mayoría llega en PDF o en
// notas sueltas, y esos expedientes no tenían ni dónde pedirlo: de 45, hay 4
// firmados.
//
// Va arriba y siempre visible, porque el objetivo es que se vea de un vistazo
// cuál falta. Un bloque que solo aparece cuando ya está hecho no sirve para
// encontrar los que no lo están.

const TONO = {
  firmado_a_distancia: { color: T.logrado, fondo: "#E8F5E9", icono: Check, texto: "Firmado" },
  firmado_en_persona: { color: T.logrado, fondo: "#E8F5E9", icono: Check, texto: "Firmado" },
  esperando: { color: T.amberDeep, fondo: T.amberTint, icono: Clock, texto: "Enlace enviado, sin firmar" },
  pendiente: { color: "#C62828", fondo: "#FFEBEE", icono: ShieldAlert, texto: "Sin consentimiento" },
};

export default function BloqueConsentimiento({
  child, documents, currentUser, puedeEditar, onAddDocument, onUpdateDocument,
}) {
  const doc = documentoDeConsentimiento(documents, child.id);
  const estado = estadoDeConsentimiento(doc);
  const { color, fondo, icono: Icono, texto } = TONO[estado];
  const consentimiento = textoConsentimiento(child);

  const [enlace, setEnlace] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [enPersona, setEnPersona] = useState("");
  const [pidiendoNombre, setPidiendoNombre] = useState(false);
  const [quitando, setQuitando] = useState(false);

  // El documento sobre el que se escribe. Si ya hay uno —propio, o el viejo
  // dentro de la anamnesis— se respeta: mover una firma de fila por comodidad
  // es justo lo que no se hace con la prueba de que alguien autorizó algo.
  const guardar = (fields) => {
    const base = doc || {
      id: idDeConsentimiento(child.id),
      childId: child.id,
      type: TIPO,
      title: `${consentimiento.titulo} — ${child.name} ${child.lastName || ""}`.trim(),
      date: TODAY,
      authorId: currentUser.id,
      notes: "",
      fields: {},
    };
    const actualizado = { ...base, fields: { ...base.fields, ...fields } };
    if (doc) onUpdateDocument?.(actualizado);
    else onAddDocument?.(actualizado);
    return actualizado;
  };

  const generarEnlace = () => {
    const token = nuevoToken();
    guardar({
      consentToken: token,
      // El título y el texto viajan con el documento: la pantalla de firma solo
      // ve el documento, y adivinarlos ahí fue lo que le pidió a una madre que
      // autorizara como representante legal. Congelarlos deja además constancia
      // de qué se aceptó exactamente, aunque el texto cambie después.
      consentChildName: `${child.name} ${child.lastName || ""}`.trim(),
      consentTitulo: consentimiento.titulo,
      consentTexto: consentimiento.texto,
    });
    setCopiado(false);
    setEnlace(enlaceDeFirma(token, window.location.origin, window.location.pathname));
  };

  const copiar = () => {
    if (!enlace) return;
    navigator.clipboard?.writeText(enlace)
      .then(() => setCopiado(true))
      .catch(() => avisar.error("No se pudo copiar", "Selecciona el enlace y cópialo a mano."));
  };

  const firmarEnPersona = () => {
    if (!enPersona.trim()) { avisar.error("Falta el nombre de quien firma."); return; }
    guardar({ firmaAcudiente: enPersona.trim(), fechaFirma: TODAY, consentToken: null });
    setPidiendoNombre(false);
    setEnPersona("");
    avisar.exito("Consentimiento registrado");
  };

  const quitarFirma = () => {
    if (!doc) return;
    onUpdateDocument?.({ ...doc, fields: sinFirma(doc.fields) });
    setQuitando(false);
    setEnlace(null);
  };

  return (
    <Card style={{ padding: "15px 18px", marginBottom: 18, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
          fontSize: 12, fontWeight: 700, color, background: fondo,
          padding: "3px 10px", borderRadius: 999,
        }}>
          <Icono size={13} /> {texto}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, flex: 1, minWidth: 0 }}>
          {consentimiento.titulo}
        </span>
      </div>

      {doc?.fields?.firmaAcudienteImg && (
        <div style={{ marginTop: 12 }}>
          <img
            src={doc.fields.firmaAcudienteImg} alt="Firma del acudiente"
            style={{ maxWidth: 280, height: "auto", border: `1px solid ${T.border}`, borderRadius: 8, background: "#fff" }}
          />
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>
            Firmado a distancia
            {doc.fields.fechaFirmaAcudiente
              ? ` el ${fmtDateShort(String(doc.fields.fechaFirmaAcudiente).slice(0, 10))}`
              : ""}
          </div>
        </div>
      )}

      {!doc?.fields?.firmaAcudienteImg && doc?.fields?.firmaAcudiente && (
        <div style={{ fontSize: 13.5, color: T.ink, marginTop: 10 }}>
          Firmado en persona por <b>{doc.fields.firmaAcudiente}</b>
          {doc.fields.fechaFirma ? ` · ${fmtDateShort(doc.fields.fechaFirma)}` : ""}
        </div>
      )}

      {estado === "pendiente" && (
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 8, lineHeight: 1.55 }}>
          Este expediente no tiene consentimiento informado firmado. Se puede
          pedir aunque la anamnesis esté en PDF o no se haya llenado.
        </div>
      )}

      {puedeEditar && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {!estado.startsWith("firmado") && (
            <>
              <Btn variant="ghost" size="sm" icon={Link2} onClick={generarEnlace}>
                {estado === "esperando" ? "Generar otro enlace" : "Generar enlace para firma"}
              </Btn>
              <Btn variant="subtle" size="sm" onClick={() => setPidiendoNombre((v) => !v)}>
                Firmó en persona
              </Btn>
            </>
          )}
          {estado.startsWith("firmado") && !quitando && (
            <Btn variant="ghost" size="sm" icon={Trash2} onClick={() => setQuitando(true)}>
              Quitar firma
            </Btn>
          )}
        </div>
      )}

      {quitando && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>
            Se borra la firma registrada y habrá que volver a pedirla.
          </span>
          <Btn variant="ghost" size="sm" onClick={() => setQuitando(false)}>Cancelar</Btn>
          <Btn variant="danger" size="sm" onClick={quitarFirma}>Sí, quitar</Btn>
        </div>
      )}

      {pidiendoNombre && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
          <input
            value={enPersona} onChange={(e) => setEnPersona(e.target.value)} autoFocus
            placeholder="Nombre de quien firma"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <Btn variant="primary" size="sm" onClick={firmarEnPersona}>Registrar</Btn>
        </div>
      )}

      {enlace && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 7, lineHeight: 1.5 }}>
            Pásaselo a la familia. Firma desde el celular y la firma queda aquí sola.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              readOnly value={enlace} onFocus={(e) => e.target.select()}
              style={{
                flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${T.border}`, fontSize: 12.5,
                fontFamily: "monospace", color: T.ink, background: "#fff",
              }}
            />
            <Btn variant="subtle" size="sm" onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar"}</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}
