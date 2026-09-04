import React, { useState } from "react";
import { Plus } from "lucide-react";
import { T, TODAY } from "../../theme.js";
import { fmtDate } from "../../lib/format.js";
import { can } from "../../permissions.js";
import { Btn, Card, EmptyNote, Eyebrow } from "../../ui/index.js";
import MeetingCard from "../MeetingCard.jsx";
import AddMeetingModal from "../modals/AddMeetingModal.jsx";

function InterdisciplinaryTab({ child, meetings, users, onAddMeeting, currentUser, documents, onAddDocument }) {
  const [adding, setAdding] = useState(false);
  const [addingPautas, setAddingPautas] = useState(false);
  const [pautasNote, setPautasNote] = useState("");
  const [pautasDate, setPautasDate] = useState(TODAY);
  const childMeetings = meetings.filter((m) => m.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));

  // Pautas de Crianza sessions — visible a quien tenga el permiso guidelines:view
  const canSeePautas = can(currentUser, "guidelines:view");
  const pautasSessions = (documents || []).filter(d => d.childId === child.id && d.type === "pautas_crianza").sort((a, b) => b.date.localeCompare(a.date));

  const savePautas = () => {
    if (!pautasNote.trim()) return;
    const doc = {
      id: `d-pautas-${Date.now()}`,
      childId: child.id,
      type: "pautas_crianza",
      title: `Pautas de Crianza - ${fmtDate(pautasDate)}`,
      date: pautasDate,
      authorId: currentUser.id,
      notes: pautasNote.trim(),
      fields: {},
    };
    if (onAddDocument) onAddDocument(doc);
    setPautasNote("");
    setAddingPautas(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Pautas de Crianza — restricted */}
      {canSeePautas && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow style={{ marginBottom: 0 }}>Pautas de Crianza</Eyebrow>
            <Btn icon={Plus} onClick={() => setAddingPautas(true)}>Registrar sesión</Btn>
          </div>
          {addingPautas && (
            <Card style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input type="date" value={pautasDate} onChange={e => setPautasDate(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }} />
              </div>
              <textarea value={pautasNote} onChange={e => setPautasNote(e.target.value)}
                placeholder="Resumen de la sesión con padres, temas trabajados, acuerdos..."
                rows={4}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: T.font, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAddingPautas(false)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontSize: 13, fontFamily: T.font, cursor: "pointer" }}>Cancelar</button>
                <button onClick={savePautas} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Guardar</button>
              </div>
            </Card>
          )}
          {pautasSessions.length === 0 && !addingPautas ? (
            <EmptyNote text="Aún no hay sesiones de Pautas de Crianza registradas." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pautasSessions.map(d => (
                <Card key={d.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.brand }}>{fmtDate(d.date)}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint }}>Sarita Szerer</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{d.notes}</div>
                </Card>
              ))}
            </div>
          )}
          <div style={{ borderBottom: `1px solid ${T.border}`, margin: "8px 0 0" }} />
        </div>
      )}

      {/* Interdisciplinary minutes */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Eyebrow style={{ marginBottom: 0 }}>Minutas interdisciplinarias</Eyebrow>
          <Btn icon={Plus} onClick={() => setAdding(true)}>Registrar minuta</Btn>
        </div>
        {childMeetings.length === 0 ? (
          <EmptyNote text="Aún no hay minutas registradas." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {childMeetings.map((m) => <MeetingCard key={m.id} meeting={m} users={users} />)}
          </div>
        )}
        {adding && (
          <AddMeetingModal onClose={() => setAdding(false)} onSave={(m) => { onAddMeeting(m); setAdding(false); }} />
        )}
      </div>
    </div>
  );
}

export default InterdisciplinaryTab;
