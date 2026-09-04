import React from "react";
import { CargandoAira } from "../ui/index.js";

// Se muestra mientras un enlace directo a /paciente/:id espera la primera carga
// de Supabase. Comparte pantalla con el arranque de la aplicacion: dos
// esperas distintas con dos aspectos distintos se leen como dos fallos.
function RouteLoading() {
  return <CargandoAira />;
}

export default RouteLoading;
