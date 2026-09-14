import React, { useState } from "react";
import { T, TODAY } from "../../theme.js";
import { Card, EmptyNote, Modal, ModalHeader, StatusIcon, StatusPill, StatusRing } from "../../ui/index.js";
import { useDataStore } from "../../store/dataStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { can } from "../../permissions.js";
import { Btn } from "../../ui/index.js";
import { ChevronDown, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import ObjetivoModal from "../modals/ObjetivoModal.jsx";
import { EscalaGas } from "../../reports/piezas.jsx";
import ObjetivosEnLoteModal from "../modals/ObjetivosEnLoteModal.jsx";
import { avisar } from "../../store/avisosStore.js";

// De quien se ofrece una columna para definir sus primeros objetivos.
//
// Antes solo entraban los especialistas que YA tenian una sesion con el
// paciente, y eso dejaba la pestana en blanco justo cuando mas se necesita: en
// un expediente recien creado no hay sesiones ni objetivos, asi que no habia
// ni una columna ni un boton para agregar el primero. Obligaba a registrar una
// sesion antes de poder fijar el objetivo que esa sesion iba a trabajar, que es
// al reves de como se trabaja.
//
// Por eso cuentan tambien los asignados: a alguien se le asigna un paciente
// para que le ponga objetivos, no despues de haberselos puesto. El encabezado
// de ChildProfile ya hacia esta misma union — aqui faltaba.
//
// Vive fuera del componente por lo mismo que clinicalAlerts: es otra
// responsabilidad — decidir de quien hay columna, no dibujarla — y asi se
// prueba sin montar React.
export function especialistasSinObjetivos({ child, sessions = [], grupos = {} }) {
  const conSesion = sessions
    .filter((s) => s.childId === child.id)
    .map((s) => s.specialistId)
    .filter(Boolean);
  const candidatos = [...new Set([...conSesion, ...(child.assignedSpecialists || [])])];
  const claves = Object.keys(grupos);
  return candidatos.filter((sid) => !claves.some((k) => k.startsWith(sid)));
}

function ObjectivesList({ objectives, compact, onUpdate, onAdd, onDelete, defaultArea }) {
  // La edicion en linea solo alcanzaba para el nombre. Desde que el objetivo
  // lleva escala GAS y metodologia — que la especificacion de reportes pide en
  // tres secciones — no cabe en una fila, y se edita en un modal.
  const [editando, setEditando] = useState(null);
  const [enLote, setEnLote] = useState(false);

  const STATUS_OPTS = [
    { val: "logrado", label: "Logrado" },
    { val: "proceso", label: "En proceso" },
    { val: "apoyo", label: "Necesita apoyo" },
  ];

  const areasSugeridas = [...new Set(objectives.map((o) => o.area).filter(Boolean))];
  if (defaultArea && !areasSugeridas.includes(defaultArea)) areasSugeridas.unshift(defaultArea);

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 0 }}>
        {objectives.map((o, i) => (
          <div key={o.id} style={{
            display: "flex", alignItems: "center", gap: 13, padding: compact ? "6px 0" : "13px 0",
            borderTop: !compact && i > 0 ? `1px solid ${T.border}` : "none",
          }}>
            <StatusRing status={o.status} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: T.ink }}>{o.name}</div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>{o.area}</div>
            </div>

            {/* La escala solo aparece si esta puesta: un hueco vacio en cada
                fila sugeriria que falta rellenar algo obligatorio, y no lo es. */}
            {!compact && (o.gasCurrent != null || o.gasTarget != null || o.gasBaseline != null) && (
              <EscalaGas base={o.gasBaseline} meta={o.gasTarget} actual={o.gasCurrent} ancho={120} />
            )}

            {/* Status selector */}
            {onUpdate && !compact && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {STATUS_OPTS.map((s) => (
                  <button key={s.val} onClick={() => onUpdate({ ...o, status: s.val })}
                    title={s.label}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: "none", cursor: "pointer",
                      background: o.status === s.val ? (s.val === "logrado" ? T.logrado : s.val === "proceso" ? T.amber : T.apoyo) : T.bg,
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      outline: o.status === s.val ? `2px solid ${s.val === "logrado" ? "#43A047" : s.val === "proceso" ? T.amberDeep : "#C62828"}` : "none",
                    }}>
                    <StatusIcon status={s.val} size={13} />
                  </button>
                ))}
              </div>
            )}

            {!compact && onUpdate && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => setEditando(o)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Editar objetivo"><Pencil size={13} /></button>
                {onDelete && <button onClick={() => onDelete(o.id)} style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Eliminar"><Trash2 size={13} /></button>}
              </div>
            )}

            {compact && <StatusPill status={o.status} />}
          </div>
        ))}
      </div>

      {editando && (
        <ObjetivoModal
          objetivo={editando.id ? editando : null}
          areasSugeridas={areasSugeridas}
          onClose={() => setEditando(null)}
          onGuardar={(o) => (o.id ? onUpdate(o) : onAdd(o))}
        />
      )}

      {onAdd && !compact && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn icon={Plus} onClick={() => setEditando({ area: defaultArea || "" })}>Agregar objetivo</Btn>
          {/* El plan de trabajo llega con ocho o diez objetivos ya redactados.
              De uno en uno son diez veces el mismo modal. */}
          <Btn variant="secondary" icon={ListPlus} onClick={() => setEnLote(true)}>
            Pegar varios
          </Btn>
        </div>
      )}

      {enLote && (
        <ObjetivosEnLoteModal
          area={defaultArea}
          onClose={() => setEnLote(false)}
          onCrear={(nombres) => {
            for (const name of nombres) onAdd({ name, area: defaultArea || "" });
            setEnLote(false);
            avisar.exito(`${nombres.length} objetivos creados`);
          }}
        />
      )}
    </div>
  );
}

// Vista de objetivos agrupados por especialista y area. Estaba en linea dentro
// de ChildProfile como una IIFE de 155 lineas; aqui es un componente con nombre.
function ObjetivosTab({ child }) {
  // Editar y borrar ocurren sobre el objetivo, dentro de su columna. Antes
  // habia una seccion "Editar objetivos" al pie con un acordeon por
  // especialidad: los objetivos se veian arriba y se editaban abajo, y desde
  // arriba no habia manera de entrar en ellos.
  const [editandoObjetivo, setEditandoObjetivo] = useState(null);
  const [borrando, setBorrando] = useState(null);

  const objectives = useDataStore((s) => s.objectives);
  const sessions = useDataStore((s) => s.sessions);
  const users = useDataStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.currentUser);
  const onUpdateObjective = useDataStore((s) => s.updateObjective);
  const onAddObjective = useDataStore((s) => s.addObjective);
  const onDeleteObjective = useDataStore((s) => s.deleteObjective);
      const childObjs = objectives.filter((o) => o.childId === child.id);
      const groups = {};
      childObjs.forEach((o) => {
        const specId = o.specialistId || "sin-especialista";
        const area = o.area || "General";
        const key = `${specId}__${area}`;
        if (!groups[key]) groups[key] = { specId, area, objs: [] };
        groups[key].objs.push(o);
      });
      const groupList = Object.values(groups).sort((a, b) => a.area.localeCompare(b.area));
      const canEdit = (specId) => can(currentUser, "objective:edit", { specialistId: specId });
      const AREA_COLORS = {
        "Terapia Ocupacional": "#175FAF",
        "Fonoaudiologia": "#7A9E7E",
        "Fonoaudiología": "#7A9E7E",
        "Funciones Ejecutivas": "#C79A6B",
        "Psicologia": "#A6779A",
        "Psicología": "#A6779A",
        "Psicologia Clinica": "#A6779A",
        "Psicología Clínica": "#A6779A",
        "Desarrollo (DVLP)": "#B8860B",
        "Kids Club": "#82A166",
        "General": T.inkSoft,
      };
      const AREA_BG = {
        "Terapia Ocupacional": "#E6F1FB",
        "Fonoaudiologia": "#F0F5F0",
        "Funciones Ejecutivas": "#FAF0E6",
        "Psicologia": "#F5EEF8",
        "Psicologia Clinica": "#F5EEF8",
        "Desarrollo (DVLP)": "#FEFDE7",
        "Kids Club": "#EEF5EE",
        "General": T.surfaceSunk,
      };

      const specsWithNoObjs = especialistasSinObjetivos({ child, sessions, grupos: groups });

      return (
        <div>
          {/* Column grid */}
          {/* auto-fit y no un numero de columnas fijo: con tres columnas duras,
              en el telefono cada una quedaba de 90px y el nombre del objetivo
              salia en vertical, una letra por linea. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))", gap: 12, marginBottom: 16 }}>
            {groupList.map(({ specId, area, objs }) => {
              const spec = users.find(u => u.id === specId);
              const canEditThis = canEdit(specId);
              const logrados = objs.filter(o => o.status === "logrado").length;
              const color = AREA_COLORS[area] || T.inkSoft;
              const bg = AREA_BG[area] || T.surfaceSunk;
              const pct = objs.length > 0 ? (logrados / objs.length) * 100 : 0;
              return (
                <div key={`${specId}__${area}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 0 12px 12px" }}>
                  {/* Column header */}
                  <div style={{ padding: "12px 14px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.brand, marginBottom: 2 }}>{area}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec ? spec.name : "—"}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                      <span style={{ fontFamily: T.font, fontSize: 22, fontWeight: 500, color }}>{logrados}</span>
                      <span style={{ fontSize: 13, color: T.inkSoft }}>/ {objs.length} logrados</span>
                    </div>
                    <div style={{ height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  {/* Objectives */}
                  <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "6px 14px 10px" }}>
                    {objs.map((o) => (
                      <div key={o.id} style={{ padding: "7px 0", borderTop: `1px solid ${T.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ display: "flex", flexShrink: 0, marginTop: 2 }}><StatusIcon status={o.status} size={14} /></span>
                          <span style={{ fontSize: 12.5, color: o.status === "logrado" ? T.logrado : T.ink, lineHeight: 1.4, flex: 1 }}>{o.name}</span>
                          {/* Editar y borrar viven aqui, en el objetivo. Antes
                              estaban en una seccion aparte al pie de la pagina:
                              se veian los objetivos arriba y no habia forma de
                              entrar en ellos desde donde se estaban mirando. */}
                          {canEditThis && (
                            <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                              <button onClick={() => setEditandoObjetivo(o)} title="Editar objetivo"
                                style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", padding: "1px 3px", lineHeight: 0 }}>
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => setBorrando(o)} title="Eliminar objetivo"
                                style={{ background: "none", border: "none", color: T.inkFaint, cursor: "pointer", padding: "1px 3px", lineHeight: 0 }}>
                                <Trash2 size={12} />
                              </button>
                            </span>
                          )}
                        </div>
                        {/* El progreso, donde esta el objetivo. Solo si lleva
                            escala puesta: un hueco vacio en cada fila sugeriria
                            que falta rellenar algo obligatorio, y no lo es. */}
                        {(o.gasCurrent != null || o.gasTarget != null || o.gasBaseline != null) && (
                          <div style={{ marginTop: 6, marginLeft: 22 }}>
                            <EscalaGas base={o.gasBaseline} meta={o.gasTarget} actual={o.gasCurrent} ancho={150} />
                          </div>
                        )}
                        {canEditThis && (
                          <div style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 22 }}>
                            {["logrado","proceso","apoyo"].map(st => (
                              <button key={st} onClick={() => { if(onUpdateObjective) onUpdateObjective({...o, status: st}); }}
                                style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontFamily: T.font,
                                  border: o.status === st ? "none" : `0.5px solid ${T.border}`,
                                  background: o.status === st ? (st === "logrado" ? "#E8F5E9" : st === "apoyo" ? "#FFEBEE" : "#FFF8E1") : "#fff",
                                  color: o.status === st ? (st === "logrado" ? T.logrado : st === "apoyo" ? "#C62828" : "#F57F17") : T.inkSoft,
                                  fontWeight: o.status === st ? 600 : 400,
                                }}>
                                {st === "logrado" ? "Logrado" : st === "proceso" ? "En proceso" : "Apoyo"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {canEditThis && (
                      <ObjectivesList
                        objectives={[]}
                        onUpdate={onUpdateObjective}
                        onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: specId, area, createdDate: TODAY, status: "proceso" })}
                        onDelete={onDeleteObjective}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {/* Specialists with no objectives yet */}
            {specsWithNoObjs.map(sid => {
              const spec = users.find(u => u.id === sid);
              if (!spec) return null;
              const area = spec.specialty || "General";
              const color = AREA_COLORS[area] || T.inkSoft;
              const canEditThis = canEdit(sid);
              return (
                <div key={`empty-${sid}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 0 12px 12px" }}>
                  <div style={{ padding: "12px 14px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.brand, marginBottom: 2 }}>{area}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 10 }}>{spec.name}</div>
                    <EmptyNote text="Sin objetivos definidos." dentroDeCaja />
                  </div>
            {canEditThis && (
                    <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "6px 14px 10px" }}>
                      <ObjectivesList
                        objectives={[]}
                        defaultArea={area}
                        onAdd={(data) => onAddObjective({ ...data, childId: child.id, specialistId: sid, area: data.area || area, createdDate: TODAY, status: "proceso" })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {editandoObjetivo && (
            <ObjetivoModal
              objetivo={editandoObjetivo}
              areasSugeridas={[...new Set(childObjs.map((o) => o.area).filter(Boolean))]}
              onClose={() => setEditandoObjetivo(null)}
              onGuardar={(o) => onUpdateObjective(o)}
            />
          )}

          {/* Un objetivo borrado se lleva su historia: el avance que registran
              las sesiones cuelga de el. Y el lapiz y la papelera estan ahora a
              dos milimetros uno del otro en un telefono. */}
          {borrando && (
            <Modal onClose={() => setBorrando(null)} width={420}>
              <ModalHeader title="Eliminar objetivo" subtitle={borrando.name} onClose={() => setBorrando(null)} />
              <div style={{ padding: "18px 24px", fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6 }}>
                Se elimina del expediente junto con el avance que se haya registrado
                sobre él. No se puede deshacer.
              </div>
              <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn variant="ghost" onClick={() => setBorrando(null)}>Cancelar</Btn>
                <Btn variant="danger" onClick={() => { onDeleteObjective(borrando.id); setBorrando(null); }}>
                  Eliminar
                </Btn>
              </div>
            </Modal>
          )}
        </div>
      );
}

export default ObjetivosTab;
export { ObjectivesList };
