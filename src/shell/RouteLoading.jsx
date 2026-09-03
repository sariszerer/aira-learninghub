import React from "react";
import { T } from "../theme.js";

// Shown while a cold deep link to /paciente/:id waits for the first Supabase load.
function RouteLoading() {
  return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontSize: 14, color: T.inkFaint }}>
      Cargando…
    </div>
  );
}

export default RouteLoading;
