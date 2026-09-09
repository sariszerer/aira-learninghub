import React, { useMemo, useState } from "react";
import { T, inputStyle } from "../theme.js";
import { useDataStore } from "../store/dataStore.js";
import { Btn, Chip, Modal, ModalHeader } from "../ui/index.js";
import { NIVELES, RUTAS } from "./preescolar.js";

// Alta y edicion de un estudiante del gabinete.
//
// El enlace con el expediente clinico es opcional: la mayoria de estos niños
// solo tienen tutor en su colegio y no reciben terapia en AIRA. Cuando si la
// reciben — pasa — enlazarlos evita tener la misma persona dos veces y permite
// saltar de un expediente al otro.

export default function EstudianteModal({ estudiante, schoolId, programa = "tutoria", onGuardar, onClose }) {
  const nuevo = !estudiante?.id;
  const children = useDataStore((s) => s.children);
  const tutores = useDataStore((s) => s.tutores);
  const guardarTutor = useDataStore((s) => s.guardarTutor);
  const users = useDataStore((s) => s.users);

  const [f, setF] = useState({
    name: estudiante?.name || "",
    lastName: estudiante?.lastName || "",
    grade: estudiante?.grade || "",
    startDate: estudiante?.startDate || "",
    tutorId: estudiante?.tutorId || "",
    childId: estudiante?.childId || "",
    notas: estudiante?.notas || "",
    nivel: estudiante?.nivel || "",
    ruta: estudiante?.ruta || "sin_evaluar",
  });
  const esPreescolar = programa === "preescolar";
  const [tutorNuevo, setTutorNuevo] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const delColegio = useMemo(
    () => tutores.filter((t) => t.activo !== false && (!t.schoolId || t.schoolId === schoolId))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [tutores, schoolId]
  );

  const tutorElegido = tutores.find((t) => t.id === f.tutorId) || null;

  // Cuentas AIRA con rol de tutora. Es la lista de la que sale el vínculo que
  // le abre a ella —y solo a ella— el expediente de su estudiante.
  const cuentasTutora = useMemo(
    () => users.filter((u) => u.role === "shadow" && u.activo !== false)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  // Buscador de pacientes: con 44 en la lista, un desplegable obliga a
  // recorrerlos todos para encontrar uno.
  const [busca, setBusca] = useState("");
  const coincidencias = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return children
      .filter((c) => `${c.name} ${c.lastName}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [children, busca]);
  const enlazado = children.find((c) => c.id === f.childId) || null;

  const guardar = async () => {
    let tutorId = f.tutorId;
    // Crear la tutora aqui evita salir de la pantalla a mitad del alta. Queda
    // ligada al colegio, que es donde trabaja.
    if (!tutorId && tutorNuevo.trim()) {
      const t = await guardarTutor({ name: tutorNuevo.trim(), schoolId, role: "shadow" });
      tutorId = t.id;
    }
    onGuardar({
      ...(estudiante || {}),
      schoolId,
      name: f.name.trim(),
      lastName: f.lastName.trim() || null,
      grade: f.grade.trim() || null,
      nivel: esPreescolar ? (f.nivel || null) : null,
      ruta: esPreescolar ? f.ruta : "sin_evaluar",
      startDate: f.startDate || null,
      tutorId: tutorId || null,
      childId: f.childId || null,
      notas: f.notas.trim() || null,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} width={580}>
      <ModalHeader
        title={nuevo ? "Nuevo estudiante" : "Editar estudiante"}
        subtitle={nuevo ? null : `${estudiante.name} ${estudiante.lastName || ""}`}
        onClose={onClose}
      />
      <div style={{ padding: 24, maxHeight: "68vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Campo etiqueta="Nombre">
            <input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)}
                   style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </Campo>
          <Campo etiqueta="Apellido">
            <input value={f.lastName} onChange={(e) => set("lastName", e.target.value)}
                   style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </Campo>
          {esPreescolar ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo etiqueta="Nivel">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {NIVELES.map((n) => (
                    <Chip key={n} label={n} selected={f.nivel === n}
                          onClick={() => set("nivel", f.nivel === n ? "" : n)} />
                  ))}
                </div>
              </Campo>
            </div>
          ) : (
            <Campo etiqueta="Grado">
              <input value={f.grade} onChange={(e) => set("grade", e.target.value)} placeholder="Ej: 1 primaria"
                     style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
            </Campo>
          )}
          <Campo etiqueta="Inicio del acompañamiento">
            <input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)}
                   style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </Campo>
        </div>

        {esPreescolar && (
          <Campo etiqueta="Ruta del caso" ayuda="Qué se decidió hacer tras el tamizaje. También se puede fijar al registrarlo.">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(RUTAS).sort((a, b) => a[1].orden - b[1].orden).map(([clave, r]) => (
                <Chip key={clave} label={r.label} selected={f.ruta === clave} onClick={() => set("ruta", clave)} />
              ))}
            </div>
          </Campo>
        )}

        {!esPreescolar && (
        <Campo etiqueta="Tutora asignada">
          {delColegio.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {delColegio.map((t) => (
                <Chip key={t.id} label={t.name} selected={f.tutorId === t.id}
                      onClick={() => { set("tutorId", f.tutorId === t.id ? "" : t.id); setTutorNuevo(""); }} />
              ))}
            </div>
          )}
          {!f.tutorId && (
            <input
              value={tutorNuevo} onChange={(e) => setTutorNuevo(e.target.value)}
              placeholder={delColegio.length ? "…o escribe el nombre de una tutora nueva" : "Nombre de la tutora"}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
            />
          )}
        </Campo>
        )}

        {/* El vínculo con su cuenta es lo que le deja ver este expediente — el
            plan, la supervisión y el reporte quincenal — sin abrirle los
            colegios y estudiantes de las demás. Sin vínculo no ve nada de
            gabinete, que es el estado seguro. */}
        {!esPreescolar && tutorElegido && (
        <Campo
          etiqueta="Cuenta AIRA de la tutora"
          ayuda="Con esto ella entra a ver el expediente de este estudiante. Solo el suyo."
        >
          {cuentasTutora.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.inkFaint }}>
              No hay cuentas con rol Tutor AIRA. Se crean en Equipo.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cuentasTutora.map((u) => (
                <Chip
                  key={u.id} label={u.name}
                  selected={tutorElegido.userId === u.id}
                  onClick={() => guardarTutor({
                    ...tutorElegido,
                    userId: tutorElegido.userId === u.id ? null : u.id,
                  })}
                />
              ))}
            </div>
          )}
        </Campo>
        )}

        <Campo
          etiqueta="Expediente clínico"
          ayuda="Solo si además recibe terapia en AIRA. Enlazarlo evita tenerlo dos veces."
        >
          {enlazado ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{enlazado.name} {enlazado.lastName}</span>
              <Btn size="sm" variant="ghost" onClick={() => { set("childId", ""); setBusca(""); }}>Quitar</Btn>
            </div>
          ) : (
            <>
              <input
                value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar paciente por nombre…"
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              />
              {coincidencias.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {coincidencias.map((c) => (
                    <Chip key={c.id} label={`${c.name} ${c.lastName}`}
                          onClick={() => { set("childId", c.id); setBusca(""); }} />
                  ))}
                </div>
              )}
            </>
          )}
        </Campo>

        <Campo etiqueta="Notas">
          <textarea value={f.notas} onChange={(e) => set("notas", e.target.value)} rows={2}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
        </Campo>
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={!f.name.trim()}>{nuevo ? "Crear estudiante" : "Guardar"}</Btn>
      </div>
    </Modal>
  );
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: T.inkFaint,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
      }}>
        {etiqueta}
      </div>
      {ayuda && <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 6 }}>{ayuda}</div>}
      {children}
    </div>
  );
}
