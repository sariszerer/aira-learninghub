import React from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { T } from "../theme.js";

// Icono del semaforo de estado de un objetivo.
//
// Sustituye a los emojis que estaban repartidos por seis archivos. Un emoji lo
// dibuja el sistema operativo: cambia de forma y de color entre Windows, macOS
// y Android, no hereda el color del texto y no escala con la tipografia. Un
// icono vectorial hace las tres cosas.
const ICONOS = {
  logrado: { Icono: CheckCircle2, color: T.logrado },
  proceso: { Icono: Clock, color: T.proceso },
  apoyo: { Icono: AlertCircle, color: T.apoyo },
};

export default function StatusIcon({ status, size = 15 }) {
  const def = ICONOS[status] || ICONOS.proceso;
  const { Icono, color } = def;
  return <Icono size={size} color={color} strokeWidth={2.2} style={{ flexShrink: 0 }} />;
}

export { ICONOS as ICONOS_ESTADO };
