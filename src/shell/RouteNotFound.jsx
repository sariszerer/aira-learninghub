import React from "react";
import { T } from "../theme.js";
import { Btn } from "../ui/index.js";

// Reached when /paciente/:id names a patient this user cannot see — either the id is
// wrong, or it belongs to someone outside their caseload. Both look the same on purpose.
function RouteNotFound({ onHome }) {
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, color: T.ink, marginBottom: 10 }}>
        Paciente no encontrado
      </div>
      <div style={{ fontSize: 14, color: T.inkFaint, marginBottom: 24 }}>
        El enlace no corresponde a un paciente de tu lista.
      </div>
      <Btn onClick={onHome}>Volver al inicio</Btn>
    </div>
  );
}

export default RouteNotFound;
