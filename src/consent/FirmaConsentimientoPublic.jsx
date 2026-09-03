import React, { useState, useEffect } from "react";
import { T, FONTS } from "../theme.js";
import { db } from "../supabase.js";
import { Btn } from "../ui/index.js";
import SignaturePad from "./SignaturePad.jsx";

function FirmaConsentimientoPublic({ token }) {
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | saving | done | error
  const [doc, setDoc] = useState(null);
  const [signatureData, setSignatureData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await db.getDocumentByConsentToken(token);
        if (cancelled) return;
        if (!found) { setStatus("notfound"); return; }
        setDoc(found);
        setStatus("ready");
      } catch (e) {
        console.error("Load consent doc:", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSave = async () => {
    if (!signatureData || !doc) return;
    setStatus("saving");
    try {
      await db.saveConsentSignature(token, signatureData);
      setStatus("done");
    } catch (e) {
      console.error("Save signature:", e);
      setStatus("error");
    }
  };

  const childName = doc?.fields?.consentChildName || doc?.fields?.nombre || "";

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF2", fontFamily: T.font, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{FONTS}</style>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%", padding: "28px 26px", boxShadow: "0 20px 60px rgba(21,47,54,0.15)", boxSizing: "border-box" }}>
        <div style={{ fontFamily: T.font, fontSize: 24, fontWeight: 500, color: "#175FAF", marginBottom: 4 }}>AIRA Learning Hub</div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 20 }}>Consentimiento informado</div>

        {status === "loading" && <div style={{ fontSize: 14, color: T.inkSoft }}>Cargando…</div>}

        {status === "notfound" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            Este link ya no está disponible — puede que ya haya sido usado o que no sea válido. Si necesitas firmar, pide un nuevo link al centro.
          </div>
        )}

        {status === "error" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
            Ocurrió un problema al cargar. Intenta de nuevo en unos minutos o pide un nuevo link al centro.
          </div>
        )}

        {status === "done" && (
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.6 }}>✅ ¡Gracias! Tu firma quedó registrada correctamente.</div>
        )}

        {(status === "ready" || status === "saving") && doc && (
          <div>
            <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, marginBottom: 18 }}>
              Yo, en calidad de representante legal de <b>{childName}</b>, autorizo la evaluación y acompañamiento psicopedagógico/psicosocial en AIRA Learning Hub.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Firma del acudiente (dibuja con el dedo o el mouse)
            </div>
            <SignaturePad onChange={setSignatureData} />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="primary" disabled={!signatureData || status === "saving"} onClick={handleSave}>
                {status === "saving" ? "Guardando…" : "Guardar firma"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FirmaConsentimientoPublic;
