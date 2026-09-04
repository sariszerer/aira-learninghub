import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { T, STATUS, inputStyle } from "../../theme.js";
import { fmtDate } from "../../lib/format.js";
import { Btn, EmptyNote, Field, Modal, ModalHeader, SelectorAsistencia, StatusIcon } from "../../ui/index.js";

const ESTADOS = ["logrado", "proceso", "apoyo"];

// Editor del registro de sesion. Las cuatro secciones clinicas — objetivos,
// actividades, observaciones y recomendaciones — se editan; la cabecera (fecha,
// especialista, especialidad, duracion) no, porque cambiarla convertiria la
// sesion en otra distinta.
//
// Antes solo eran editables observaciones y recomendaciones. Objetivos y
// actividades se mostraban de solo lectura y unicamente si ya tenian contenido,
// asi que una sesion vacia — que es el caso de las 438 importadas del
// calendario — no ofrecia ninguna forma de rellenarlos.
function EditSessionModal({ session, objectives, users, onClose, onSave }) {
  const specialist = users.find((u) => u.id === session.specialistId);

  const delNino = useMemo(
    () => objectives.filter((o) => o.childId === session.childId),
    [objectives, session.childId]
  );

  const reparto = useMemo(
    () => repartirObjetivos(session.objectivesWorked, delNino.map((o) => o.id)),
    [delNino, session.objectivesWorked]
  );
  const huerfanas = reparto.huerfanas;

  const [trabajados, setTrabajados] = useState(reparto.editables);
  const [actividades, setActividades] = useState(() => (session.activities || []).join("\n"));
  const [attendance, setAttendance] = useState(session.attendance || "asistio");
  const [observation, setObservation] = useState(session.observation || "");
  const [nextSteps, setNextSteps] = useState(session.nextSteps || "");

  const alternar = (id) =>
    setTrabajados((prev) => {
      const sig = { ...prev };
      if (id in sig) delete sig[id];
      else sig[id] = "proceso";
      return sig;
    });

  const ponerEstado = (id, estado) => setTrabajados((prev) => ({ ...prev, [id]: estado }));

  // Agrupado por area: un paciente puede tener objetivos de varias disciplinas
  // y sin la separacion la lista es una pila plana sin jerarquia.
  const porArea = useMemo(() => {
    const m = new Map();
    for (const o of delNino) {
      if (!m.has(o.area)) m.set(o.area, []);
      m.get(o.area).push(o);
    }
    return [...m.entries()];
  }, [delNino]);

  const guardar = () => {
    onSave(componerSesion(session, { trabajados, huerfanas, actividades, observation, nextSteps, attendance }));
    onClose();
  };

  return (
    <Modal onClose={onClose} width={620}>
      <ModalHeader
        title="Editar registro de sesión"
        subtitle={`${fmtDate(session.date)} · ${specialist?.name || "—"}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "14px 16px", background: T.surfaceSunk, borderRadius: 10 }}>
          <Field label="Fecha" value={fmtDate(session.date)} />
          <Field label="Especialista" value={specialist?.name || "—"} />
          <Field label="Especialidad" value={session.specialty || "—"} />
          <Field label="Duración" value={session.duration ? `${session.duration} min` : "—"} />
        </div>

        <Seccion titulo="Asistencia">
          <SelectorAsistencia valor={attendance} onChange={setAttendance} />
        </Seccion>

        <Seccion titulo="Objetivos de la sesión">
          {porArea.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {porArea.map(([area, lista]) => (
                <div key={area}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.inkFaint, marginBottom: 6 }}>{area}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lista.map((o) => {
                      const activo = o.id in trabajados;
                      return (
                        <div
                          key={o.id}
                          style={{
                            border: `1.5px solid ${activo ? T.brand : T.border}`,
                            background: activo ? T.brandTint : T.surface,
                            borderRadius: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => alternar(o.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 10, width: "100%",
                              padding: "10px 12px", border: "none", background: "transparent",
                              cursor: "pointer", textAlign: "left", fontFamily: T.font,
                            }}
                          >
                            <span style={{
                              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                              border: `2px solid ${activo ? T.brand : T.inkFaint}`,
                              background: activo ? T.brand : T.surface,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {activo && <Check size={12} strokeWidth={3} color="#fff" />}
                            </span>
                            <span style={{ fontSize: 13, color: activo ? T.brand : T.ink, fontWeight: activo ? 600 : 400 }}>
                              {o.name}
                            </span>
                          </button>
                          {activo && (
                            <div style={{ display: "flex", gap: 6, padding: "0 12px 10px 40px", flexWrap: "wrap" }}>
                              {ESTADOS.map((e) => {
                                const sel = trabajados[o.id] === e;
                                return (
                                  <button
                                    key={e}
                                    type="button"
                                    onClick={() => ponerEstado(o.id, e)}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 5,
                                      padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                                      fontFamily: T.font, fontSize: 12,
                                      fontWeight: sel ? 600 : 400,
                                      border: `1.5px solid ${sel ? STATUS[e].color : T.border}`,
                                      background: sel ? STATUS[e].tint : T.surface,
                                      color: sel ? STATUS[e].color : T.inkSoft,
                                    }}
                                  >
                                    <StatusIcon status={e} size={13} />
                                    {STATUS[e].label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote
              text="Este paciente todavía no tiene objetivos definidos. Se crean en la pestaña Plan de trabajo."
              dentroDeCaja
            />
          )}
          {huerfanas.length > 0 && (
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 8 }}>
              {huerfanas.length} objetivo{huerfanas.length > 1 ? "s" : ""} de esta sesión ya no existe
              {huerfanas.length > 1 ? "n" : ""} en la ficha. Se conserva{huerfanas.length > 1 ? "n" : ""} al guardar.
            </div>
          )}
        </Seccion>

        <Seccion titulo="Actividades realizadas">
          <textarea
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            rows={4}
            placeholder={"Una por línea, ej:\nColor Code\nJuego de turnos\nMasilla"}
            style={areaTexto}
          />
        </Seccion>

        <Seccion titulo="Observaciones clínicas">
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={5}
            placeholder="Cómo estuvo el paciente, avances, dificultades observadas..."
            style={areaTexto}
          />
        </Seccion>

        <Seccion titulo="Recomendaciones para casa / escuela">
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            rows={3}
            placeholder="Indicaciones para los padres o el equipo escolar..."
            style={areaTexto}
          />
        </Seccion>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar}>Guardar</Btn>
      </div>
    </Modal>
  );
}

const areaTexto = {
  ...inputStyle,
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  lineHeight: 1.6,
};

function Seccion({ titulo, children }) {
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: 8,
      }}>
        {titulo}
      </div>
      {children}
    </div>
  );
}

// --- Lógica de datos, separada del pintado para poder probarla ---------------
//
// Se extrajo después de que el modal duplicara una entrada huérfana en cada
// guardado: la pantalla se veía correcta y el fallo solo aparecía en el payload.

// Reparte objectivesWorked en lo editable (su objetivo sigue en la ficha) y lo
// huérfano (borrado, o de otra ficha). Las huérfanas no se pueden mostrar, pero
// tampoco se descartan: se reanexan al guardar. Sin esto, abrir y guardar una
// sesión antigua la vaciaría. Y sin la separación, una huérfana entraría además
// al estado editable y saldría dos veces.
export function repartirObjetivos(objectivesWorked, idsExistentes) {
  const ids = idsExistentes instanceof Set ? idsExistentes : new Set(idsExistentes);
  const editables = {};
  const huerfanas = [];
  for (const ow of objectivesWorked || []) {
    if (ids.has(ow.objectiveId)) editables[ow.objectiveId] = ow.status || "proceso";
    else huerfanas.push(ow);
  }
  return { editables, huerfanas };
}

export function componerSesion(session, { trabajados, huerfanas, actividades, observation, nextSteps, attendance }) {
  return {
    ...session,
    attendance: attendance || session.attendance || "asistio",
    objectivesWorked: [
      ...Object.entries(trabajados).map(([objectiveId, status]) => ({ objectiveId, status })),
      ...huerfanas,
    ],
    activities: actividades.split("\n").map((a) => a.trim()).filter(Boolean),
    observation: observation.trim(),
    nextSteps: nextSteps.trim(),
  };
}

export default EditSessionModal;
