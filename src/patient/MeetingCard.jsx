import React from "react";
import { T } from "../theme.js";
import { fmtDateShort } from "../lib/format.js";
import { Card, Field, FieldLabel } from "../ui/index.js";

function MeetingCard({ meeting, users }) {
  const author = users.find((u) => u.id === meeting.createdBy);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDeep, letterSpacing: "0.04em" }}>{fmtDateShort(meeting.date)}</div>
          <div style={{ fontFamily: T.font, fontSize: 16.5, fontWeight: 600, color: T.ink, marginTop: 4 }}>{meeting.type}</div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.brand, background: T.brandTint, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
          Registrada por {author?.name.split(" ")[0] || "—"}
        </span>
      </div>
      <Field label="Participantes" value={meeting.participants} />
      <div style={{ marginTop: 10 }}>
        <FieldLabel>Resumen</FieldLabel>
        <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{meeting.summary}</p>
      </div>
      {meeting.agreements && (
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Acuerdos</FieldLabel>
          <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.6, fontWeight: 600 }}>{meeting.agreements}</p>
        </div>
      )}
    </Card>
  );
}

export default MeetingCard;
