import React, { useMemo, useState } from "react";
import { AlertTriangle, Plus, Stethoscope } from "lucide-react";
import { T } from "../theme.js";
import { contar } from "../lib/format.js";
import { can } from "../permissions.js";
import { useDataStore } from "../store/dataStore.js";
import { useAuthStore } from "../store/authStore.js";
import { Avatar, Btn, Card, Eyebrow } from "../ui/index.js";
import { NIVELES, RUTAS, faltaExpediente, resumenDeNivel, tonoDe } from "./preescolar.js";

// Programa de detección, prevención y atención en preescolar.
//
// Se organiza por nivel porque asi lo hace el colegio: el tamizaje se aplica
// por grupo y la coordinacion pregunta "como va PK3", no "como va Juan". Cada
// nivel es una seccion con su resumen; los nombres estan dentro.

export default function PanelPreescolar({ school, onAbrirEstudiante, onNuevoEstudiante }) {
  const estudiantes = useDataStore((s) => s.estudiantesGabinete);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [nivelAbierto, setNivelAbierto] = useState(null);

  const delColegio = useMemo(
    () => estudiantes.filter((e) => e.schoolId === school.id),
    [estudiantes, school.id]
  );

  const puedeEscribir = can(currentUser, "gabinete:session:create");

  // Un caso derivado sin expediente clinico esta a medio cerrar. Se avisa
  // arriba y no dentro del nivel: es lo que hay que resolver hoy, y enterrado
  // en una lista de cinco secciones no lo ve nadie.
  const pendientes = useMemo(() => delColegio.filter(faltaExpediente), [delColegio]);

  const sinNivel = delColegio.filter((e) => !e.nivel);

  return (
    <div>
      {pendientes.length > 0 && (
        <Card style={{
          marginBottom: 18, padding: "14px 16px",
          background: T.apoyoTint, border: `1px solid ${T.apoyo}33`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={17} color={T.apoyo} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.apoyo }}>
                {contar(pendientes.length, "caso derivado", "casos derivados")} sin expediente en el centro
              </div>
              <div style={{ fontSize: 12.5, color: T.ink, marginTop: 3, lineHeight: 1.5 }}>
                Se decidió que {pendientes.length === 1 ? "necesita" : "necesitan"} atención en el
                centro pero {pendientes.length === 1 ? "no tiene" : "no tienen"} expediente clínico
                abierto: {pendientes.map((e) => `${e.name} ${e.lastName || ""}`.trim()).join(", ")}.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <Eyebrow>Tamizaje por nivel</Eyebrow>
        {puedeEscribir && (
          <Btn size="sm" icon={Plus} onClick={() => onNuevoEstudiante()}>Agregar estudiante</Btn>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {NIVELES.map((nivel) => {
          const delNivel = delColegio.filter((e) => e.nivel === nivel);
          const r = resumenDeNivel(delNivel);
          const abierto = nivelAbierto === nivel;
          return (
            <Card key={nivel} style={{ padding: 0, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setNivelAbierto(abierto ? null : nivel)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "14px 17px", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left", fontFamily: T.font,
                }}
              >
                <div style={{
                  width: 44, height: 34, borderRadius: 8, flexShrink: 0,
                  background: delNivel.length ? T.brandTint : T.surfaceSunk,
                  color: delNivel.length ? T.brand : T.inkFaint,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>
                  {nivel}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>
                    {r.total ? contar(r.total, "estudiante", "estudiantes") : "Sin estudiantes registrados"}
                  </div>
                  {r.total > 0 && (
                    <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>
                      {[
                        r.sinEvaluar && `${r.sinEvaluar} sin evaluar`,
                        r.derivados && `${r.derivados} derivado${r.derivados === 1 ? "" : "s"}`,
                      ].filter(Boolean).join(" · ") || "Todos evaluados"}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, color: T.brand, fontWeight: 600 }}>
                  {abierto ? "Ocultar" : "Ver"}
                </span>
              </button>

              {abierto && (
                <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "6px 10px 12px" }}>
                  {delNivel.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: T.inkFaint, padding: "12px 8px" }}>
                      Ningún estudiante en {nivel} todavía.
                    </div>
                  ) : (
                    delNivel
                      .slice()
                      .sort((a, b) => `${a.name} ${a.lastName || ""}`.localeCompare(`${b.name} ${b.lastName || ""}`))
                      .map((e) => <FilaEstudiante key={e.id} estudiante={e} onAbrir={onAbrirEstudiante} />)
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {sinNivel.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Sin nivel asignado</Eyebrow>
          <Card style={{ padding: "6px 10px 10px" }}>
            {sinNivel.map((e) => <FilaEstudiante key={e.id} estudiante={e} onAbrir={onAbrirEstudiante} />)}
          </Card>
        </div>
      )}
    </div>
  );
}

function FilaEstudiante({ estudiante, onAbrir }) {
  const ruta = RUTAS[estudiante.ruta] || RUTAS.sin_evaluar;
  const tono = tonoDe(ruta.tono, T);
  const falta = faltaExpediente(estudiante);
  return (
    <button
      type="button"
      onClick={() => onAbrir(estudiante.id)}
      style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%",
        padding: "9px 8px", background: "none", border: "none",
        borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: T.font,
      }}
    >
      <Avatar name={`${estudiante.name} ${estudiante.lastName || ""}`} bg={T.brand} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {estudiante.name} {estudiante.lastName || ""}
        </div>
        {estudiante.childId && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.inkFaint, marginTop: 1 }}>
            <Stethoscope size={10} /> con expediente en el centro
          </div>
        )}
      </div>
      {falta && <AlertTriangle size={14} color={T.apoyo} />}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
        background: tono.fondo, color: tono.color, whiteSpace: "nowrap",
      }}>
        {ruta.label}
      </span>
    </button>
  );
}
